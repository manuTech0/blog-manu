import { ZodUser } from "@/lib/allZodSchema";
import { User } from "@/lib/generated/prisma";
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { ApiResponse, ErrorZod } from "@/lib/types";
import { JWTVerifyResult } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const { resetPasswordSchema } = new ZodUser()
type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {(Promise<NextResponse<ApiResponse<User | ErrorZod[]>>>)}
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<User | ErrorZod[]>>> {
    try {
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        const user: User | null = await prisma.user.findUnique({
            where: { email: payload.payload.email }
        })
        if(!user) {
            return NextResponse.json({
                message: "User not found",
                error: true
            })
        }
        if(!user.otpExp || new Date() > user.otpExp) {
            return NextResponse.json({
                message: "OTP Expired",
                error: true
            })
        }
        if(user.isVerified) {
            const body: ResetPasswordSchemaType = await request.json()
            const validatedData: ResetPasswordSchemaType = await resetPasswordSchema.parseAsync(body)
            const update = await prisma.user.update({
                where: { userId: user.userId },
                data: {
                    password: validatedData.newPassword
                },
                omit: {
                    password: true,
                }
            })
            return NextResponse.json({
                message: "Success reset password",
                data: update,
                error: true
            })
        } else {
            return NextResponse.json({
                message: "OTP Verify vailed",
                error: true
            }, { status: 501 })
        }
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