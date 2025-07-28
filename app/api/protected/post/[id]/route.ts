import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify"
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { JWTVerifyResult } from "jose";
import { slugifyOptions } from "@/lib/utils";
import { ZodPost } from "@/lib/allZodSchema";
import { ApiResponse, ErrorZod, Post, User } from "@/lib/types";

const { createSchema, updateSchema } = new ZodPost()

type CreateData = z.infer<typeof createSchema>

type UpdateData = z.infer<typeof updateSchema>




/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {(Promise<NextResponse<ApiResponse<Post<User> | ErrorZod>>>)}
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Post<User> | ErrorZod>>> {
    try {
        const body: CreateData = await request.json()
        const validatedData = await createSchema.parseAsync(body)
        const slug = slugify(validatedData.title, slugifyOptions)
        const responseCreate = await prisma.post.create({
            data: {
                userId: validatedData.userId,
                title: validatedData.title,
                content: validatedData.content,
                slug: slug
            },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        createdAt: true,
                        uniqueId: true,
                    }
                }
            }
        })
        return NextResponse.json({
            message: "Success create data with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
    } catch (error) {
       if(error instanceof z.ZodError) {
            const errorMessage: ErrorZod[] = error.issues.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))

            return NextResponse.json({
                message: "Error Validating",
                data: errorMessage,
                error: true,
            }, { status: 200 })
        } 
        if(error instanceof PrismaClientKnownRequestError) {
            if(error.code == "P2025") {
                return NextResponse.json({
                    message: "Cannot get user for this UID",
                    error: true
                }, { status: 500 })
            }
        }
        if(error instanceof Error) {
            logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
        return NextResponse.json({
            message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
            error: true
        }, { status: 500 } )
    }
}


/**
 *
 *
 * @export
 * @param {NextResponse} request
 * @param {{ params: Promise<{ id: string }> }} { params }
 * @return {*}  {(Promise<NextResponse<ApiResponse<Post | ErrorZod[]>>>)}
 */
export async function PUT(request: NextResponse, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Post | ErrorZod[]>>> {
    try {
        const body: UpdateData = await request.json()
        const validatedData = await updateSchema.parseAsync(body)
        const { id } = await params
        if(isNaN(Number(id))) {
            return NextResponse.json({
                message: "Parameter invalid",
                error: true
            }, { status: 500 })
        }
        const getLastData = await prisma.post.findUnique({
            where: { postId: Number(id) }
        })
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        const userInPayload = await prisma.user.findUnique({
            where: { email: payload.payload.email }
        })
        if(!(payload.payload.role == "ADMIN" || userInPayload?.userId == getLastData?.userId)) {
            return NextResponse.json({
                message: "Access not granted",
                error: true
            }, { status: 501 })
        }
        let slug:  Awaited<ReturnType<typeof slugify>> | undefined = undefined
        if(validatedData.title) {
             slug = slugify(validatedData.title , slugifyOptions)
        }
        const responseCreate = await prisma.post.update({
            where: { postId: Number(id) },
            data: {
                title: validatedData.title,
                content: validatedData.content,
                slug: slug
            }
        })
        return NextResponse.json({
            message: "Success update data with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage: ErrorZod[] = error.issues.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))

            return NextResponse.json({
                message: "Error Validating",
                data: errorMessage,
                error: true,
            }, { status: 200 })
        }
        if(error instanceof PrismaClientKnownRequestError) {
            if(error.code == "P2025") {
                return NextResponse.json({
                    message: "Cannot get user for this UID",
                    error: true
                }, { status: 500 })
            }
        }
        if(error instanceof Error) {
            logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
        return NextResponse.json({
            message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
            error: true
        }, { status: 500 } )
    }
}


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} { params }
 * @return {*}  {(Promise<NextResponse<ApiResponse<Post | ErrorZod[]>>>)}
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse<ApiResponse<Post | ErrorZod[]>>> {
    try {
        const { id } = await params
        if(isNaN(Number(id))) {
            return NextResponse.json({
                message: "Parameter invalid",
                error: true
            }, { status: 500 })
        }
        const getLastData = await prisma.post.findUnique({
            where: { postId: Number(id) }
        })
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        const userInPayload = await prisma.user.findUnique({
            where: { email: payload.payload.email }
        })
        if(!(payload.payload.role == "ADMIN" || userInPayload?.userId == getLastData?.userId)) {
            return NextResponse.json({
                message: "Access not granted",
                error: true
            }, { status: 501 })
        }
        const user = await prisma.post.findUnique({
            where: { postId: Number(id) }
        })
        if(!user) {
            return NextResponse.json({
                message: "Data not found",
                error: true
            }, { status: 404 })
        }
        const responseCreate = await prisma.post.update({
            where: { postId: Number(id) },
            data: {
                isDeleted: true
            }
        })
        return NextResponse.json({
            message: "Success store data to trash with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage: ErrorZod[] = error.issues.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))

            return NextResponse.json({
                message: "Error Validating",
                data: errorMessage,
                error: true,
            }, { status: 200 })
        }
        if(error instanceof Error) {
            logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
        return NextResponse.json({
            message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
            error: true
        }, { status: 500 } )
    }
}
