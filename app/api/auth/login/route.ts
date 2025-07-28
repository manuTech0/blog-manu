import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"
import argon2 from "argon2"
import { User } from "@/lib/generated/prisma";
import { CustomJWTPayload, generateToken, TokenError, isTokenError } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import { ApiResponse, ErrorZod, GenerateTokenType } from "@/lib/types";
import { ZodAuth } from "@/lib/allZodSchema";

const { loginSchema } = new ZodAuth()




/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {(Promise<NextResponse<ApiResponse<string | ErrorZod[]>>>)}
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<string | ErrorZod[]>>>  {
    try {
        const body: Body = await request.json()

        const validatedData = await loginSchema.parseAsync(body)

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
                    jti: user.uniqueId || String(user.userId),
                    isverified: user.isVerified
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
            const errorMessage: ErrorZod[] = error.issues.map(err => ({
                path: err.path.join('.'),
                message: err.message
            }))

            return NextResponse.json({
                message: "Error Validating: ",
                data: errorMessage,
                error: true
            }, { status: 405 } )
        }
        if(error instanceof Error) {
            logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
        return NextResponse.json({
            message: "Unknown error",
            error: true
        })
    }
}
