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

const userSchema = z.object({
    username: z.string().min(4, { message: "The username must be more than 4 characters" }).max(110, { message: "The username must not exceed 110 characters" }).superRefine(async (value: string, ctx) => {
        const username: number = await prisma.user.count({
            where: { username: value }
        })

        if (username > 0){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The username already taken",
                path: ["username"]
            })
        }
    }),
    email: z.string().email({ message: "invalid email addredd" }).max(80, { message: "The email must not exceed 80 characters" }).superRefine(async (value: string, ctx) => {
        const email: number = await prisma.user.count({
            where: { email: value }
        })

        if (email > 0){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The email already taken",
                path: ["email"]
            })
        }
    }),
    password: z.string().min(8, { message: "The password must be at least 8 charcaters long" })
        .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "The password must contain at least one number" }),
    role: z.enum([ "USER", "ADMIN" ]),

})
type UserTypeBody = z.infer<typeof userSchema>

const updateUserSchema = z.object({
    username: z.string().min(4, { message: "The username must be more than 4 characters" }).max(110, { message: "The username must not exceed 110 characters" }).superRefine(async (value: string, ctx) => {
        const username: number = await prisma.user.count({
            where: { username: value }
        })

        if (username > 0){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The username already taken",
                path: ["username"]
            })
        }
    }),
    email: z.string().email({ message: "invalid email addredd" }).max(80, { message: "The email must not exceed 80 characters" }).superRefine(async (value: string, ctx) => {
        const email: number = await prisma.user.count({
            where: { email: value }
        })

        if (email > 0){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The email already taken",
                path: ["email"]
            })
        }
    }),
    password: z.string().min(8, { message: "The password must be at least 8 charcaters long" })
        .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "The password must contain at least one number" }),
    role: z.enum([ "USER", "ADMIN" ]),
})
type UpdateUserTypeBody = z.infer<typeof updateUserSchema>

export async function POST(request: NextRequest) {
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
                }
            })
            return NextResponse.json({
                message: "Success crete data",
                data: update,
                error: false
            }, { status: 200 })
        } else {
            return NextResponse.json({
                messae: "Access not granted",
                error: true
            }, { status: 501 })
        }
    } catch (error) {
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId : string }>} ) {
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
                }
            })
            return NextResponse.json({
                message: `Success update data with userId=${userId}`,
                data: update,
                error: false
            })
        } else {
            return NextResponse.json({
                messae: "Access not granted",
                error: true
            }, { status: 501 })
        }
    } catch (error) {
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId : string }>} ) {
    try {
        const { userId } = await params
        console.log(userId)
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
                }
            })
            return NextResponse.json({
                message: `Success deleted data with userId=${userId}`,
                data: deleted,
                error: false
            })
        } else {
            return NextResponse.json({
                messae: "Access not granted",
                error: true
            }, { status: 501 })
        }
    } catch (error) {
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

