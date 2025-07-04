import { User } from "@/lib/generated/prisma";
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { JWTVerifyResult } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const resetPasswordSchema = z.object({
    password: z.string().min(8, { message: "The password must be at least 8 charcaters long" })
        .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "The password must contain at least one number" }),
    newPassword: z.string().min(8, { message: "The password must be at least 8 charcaters long" })
        .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "The password must contain at least one number" }),
    newRetryPassword: z.string().min(8, { message: "The password must be at least 8 charcaters long" })
        .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "The password must contain at least one number" }),
}).superRefine((data, ctx) => {
    if(data.newPassword != data.newRetryPassword) {
        return ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Password not same",
            path: ["newPassword"]
        })
    }
})
type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>

export async function PUT(request: NextRequest) {
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