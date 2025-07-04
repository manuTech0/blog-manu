import { User } from "@/lib/generated/prisma";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify"
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { JWTVerifyResult } from "jose";

const CreateDataScheama = z.object({
    userId: z.number().min(1),
    title: z.string().min(10).max(120).superRefine(async (value: string | undefined, ctx) => {
        const findSlugOfOtherPost = await prisma.post.findFirst({
            where: { title: { contains: value } }
        })
        logger.debug(value, findSlugOfOtherPost)
        if( !findSlugOfOtherPost || findSlugOfOtherPost == null ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Title already",
                path: ["title"]
            })
        }
    }),
    content: z.string().min(30)
})

type CreateData = z.infer<typeof CreateDataScheama>
const UpdateDataScheama = z.object({
    title: z.string().min(10).max(120).superRefine(async (value: string | undefined, ctx) => {
        if(!value) return
        const slug = slugify(value, {
            lower: true,
            strict: true,
            locale:  "id",
            trim: true,
        })
        const findSlugOfOtherPost = await prisma.post.findFirst({
            where: { slug: slug }
        })
        if( !findSlugOfOtherPost ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Title already",
                path: ["title"]
            })
        }
    }).optional(),
    content: z.string().min(30).optional(),
    slug: z.string().min(1)
})

type UpdateData = z.infer<typeof UpdateDataScheama>

export async function POST(request: NextRequest) {
    try {
        const body: CreateData = await request.json()
        const validatedData = await CreateDataScheama.parseAsync(body)
        const slug = slugify(validatedData.title ,{
            lower: true,
            strict: true,
            locale:  "id",
            trim: true,
        })
        const responseCreate = await prisma.post.create({
            data: {
                userId: validatedData.userId,
                title: validatedData.title,
                content: validatedData.content,
                slug: slug
            },
            include: {
                user: true
            }
        })
        return NextResponse.json({
            messgae: "Success create data with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage = error.errors.map(err => ({
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
            const errorReport = logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
    }
}
export async function PUT(request: NextResponse, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body: UpdateData = await request.json()
        const validatedData = await UpdateDataScheama.parseAsync(body)
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
             slug = slugify(validatedData.title , {
                lower: true,
                strict: true,
                locale: "id",
                trim: true
            })
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
            messgae: "Success update data with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage = error.errors.map(err => ({
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
            const errorReport = logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        if(isNaN(Number(id))) {
            return NextResponse.json({
                message: "Parameter invalid",
                error: true
            }, { status: 500 })
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
            messgae: "Success store data to trash with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage = error.errors.map(err => ({
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
            const errorReport = logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
    }
}