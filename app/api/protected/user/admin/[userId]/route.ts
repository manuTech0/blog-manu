import { User } from "@/lib/generated/prisma";
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { JWTVerifyResult } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2"
import { addMonths, startOfMonth } from "date-fns";
import { generateUniqueId } from "@/lib/generateId";
import { ZodUser } from "@/lib/allZodSchema";
import { ApiResponse, ErrorZod } from "@/lib/types";

const { createUserSchema: userSchema, updateUserSchema } = new ZodUser()

type UserTypeBody = z.infer<typeof userSchema>

type UpdateUserTypeBody = z.infer<typeof updateUserSchema>

/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {(Promise<NextResponse<ApiResponse<User | ErrorZod[]>>>)}
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<User | ErrorZod[]>>> {
    try {
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        if(payload.payload.role == "ADMIN") {
            const body: UserTypeBody = await request.json()
    
            const validatedData: UserTypeBody = await userSchema.parseAsync(body)
    
            const hashedPassword: string = await argon2.hash(validatedData.password, { secret: Buffer.from(process.env.ARGON2_SECRET || "secret") })
    
            const response = await prisma.user.create({
                data: {
                    username: validatedData.username,
                    email: validatedData.email,
                    password: hashedPassword,
                    otp: "",
                    role: validatedData.role
                },
                select: {
                    userId: true
                }
            })
    
            const now: Date = new Date()
            const start: Date = startOfMonth(now)
            const end: Date = addMonths(startOfMonth(now), 1)
    
            const users: User[] = await prisma.user.findMany({
                where: {
                    createdAt: {
                        gte: start,
                        lt: end
                    }
                }
            })
    
            const id: string = generateUniqueId(users, response.userId)
            const update = await prisma.user.update({
                where: { userId: response.userId },
                data: {
                    uniqueId: id
                },
                omit: { password: true, otp: true }
            })
            return NextResponse.json({
                message: "Success crete data",
                data: update,
                error: false
            }, { status: 200 })
        } else {
            return NextResponse.json({
                message: "Access not granted",
                error: true
            }, { status: 501 })
        }
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage = error.issues.map(err => ({
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
            logger.error("Error api: ", error)
            return NextResponse.json({
                message: error?.message || `Error: ${error}`,
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
 * @param {{ params: Promise<{ userId : string }>}} { params }
 * @return {*}  {(Promise<NextResponse<ApiResponse<User | ErrorZod[]>>>)}
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId : string }>} ): Promise<NextResponse<ApiResponse<User | ErrorZod[]>>> {
    try {
        const { userId } = await params
        if(isNaN(Number(userId)) || userId == null) { 
            return NextResponse.json({
                message: "Cannot sellectted data, params is not number or it's empty",
                error: true
            }, { status: 404 })
        }
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        if(payload.payload.role == "ADMIN") {
            const putBody: UpdateUserTypeBody = await request.json()
            const validatedData: UpdateUserTypeBody = await updateUserSchema.parseAsync(putBody)
            const update = await prisma.user.update({
                where: { userId: Number(userId) },
                data: {
                    email: validatedData.email,
                    username: validatedData.username,
                    role: validatedData.role
                },
                omit: { password: true, otp: true }
            })
            return NextResponse.json({
                message: `Success update data with userId=${userId}`,
                data: update,
                error: false
            })
        } else {
            return NextResponse.json({
                message: "Access not granted",
                error: true
            }, { status: 501 })
        }
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage = error.issues.map(err => ({
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
            return NextResponse.json({
                message: error?.message || `Error: ${error}`,
                error: true
            }, { status: 500 } )
        }
        logger.error("unknown error", error)
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
 * @param {{ params: Promise<{ userId : string }>}} { params }
 * @return {*}  {(Promise<NextResponse<ApiResponse<User | ErrorZod[]>>>)}
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId : string }>} ): Promise<NextResponse<ApiResponse<User | ErrorZod[]>>> {
    try {
        const param = await params
        const userId = param.userId
        if(isNaN(Number(userId)) || userId == null) { 
            return NextResponse.json({
                message: "Cannot sellectted data, params is not number or it's empty",
                error: true
            }, { status: 404 })
        }
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        if(payload.payload.role == "ADMIN") {
            const deleted = await prisma.user.update({
                where: { userId: Number(userId) },
                data: {
                    isDeleted: true
                },
                omit: { password: true, otp: true }
            })
            return NextResponse.json({
                message: `Success deleted data with userId=${userId}`,
                data: deleted,
                error: false
            })
        } else {
            return NextResponse.json({
                message: "Access not granted",
                error: true
            }, { status: 501 })
        }
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage = error.issues.map(err => ({
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
            return NextResponse.json({
                message: error?.message || `Error: ${error}`,
                error: true
            }, { status: 500 } )
        }
        logger.error("unknown error", error)
        return NextResponse.json({
            message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
            error: true
        }, { status: 500 } )
    }
}

