import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod"
import argon2 from "argon2"
import { User } from "@/lib/generated/prisma";
import { CustomJWTPayload, GenerateTokenType, generateToken, TokenError, isTokenError } from "@/lib/jwt";
import { logger } from "@/lib/logger";

const BodySchema = z.object({
    email: z.string().email({ message: "invalid email addredd" }).max(80, { message: "The email must not exceed 80 characters" }).superRefine(async (value: string, ctx) => {
        const email: number = await prisma.user.count({
            where: { email: value }
        })

        if (email < 0){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The email was not found",
                path: ["email"]
            })
        }
    }),
    password: z.string().min(8, { message: "The password must be at least 8 charcaters long" })
        .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "The password must contain at least one number" })
})

type Body = z.infer<typeof BodySchema>

export async function POST(request: NextRequest) {
    try {
        const body: Body = await request.json()

        const validatedData = await BodySchema.parseAsync(body)

        const user: User | null = await prisma.user.findUnique({ where: { email: validatedData.email } })

        if(user) {
            const verify: boolean = await argon2.verify(user.password, validatedData.password, {
                secret: Buffer.from(process.env.ARGON2_SECRET || "secret")
            })

            if(user && verify) {
                const payload: CustomJWTPayload = {
                    email: user.email,
                    role: user.role,
                    iss: process.env.API_URL || "my-blog.com",
                    sub: user.uniqueId || String(user.userId),
                    aud: user.username,
                    iat: new Date().getTime(),
                    jti: user.uniqueId || String(user.userId)
                }
                const token: GenerateTokenType | TokenError = await generateToken(payload, "14d")
                if(isTokenError(token)) {
                    return NextResponse.json({
                        message: "Error get token",
                        data: token,
                        error: true
                    }, { status: 401 })
                } else {
                    return NextResponse.json({
                        message: "Success get token",
                        data: token,
                        error: false
                    }, { status: 200 })
                }
            } else {
                return NextResponse.json({
                    message: "The password is incorrect",
                    error: true,
                }, { status: 401 })
            }
        } else {
            return NextResponse.json({
                message: "The user was not found ",
                error: true,
            }, { status: 401 })

        }

    } catch (error) {
        if(error instanceof z.ZodError) {
            const errorMessage = error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))

            return NextResponse.json({
                message: "Error Validating: ",
                data: errorMessage,
                error: true
            }, { status: 400 } )
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