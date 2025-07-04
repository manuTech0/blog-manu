import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { JWTVerifyResult } from "jose";
import { NextResponse } from "next/server";
import { z } from "zod";

const otpValidateSchema = z.object({
    otp: z.string().min(1).max(6).regex(/[A-Z0-9]/, { message: "Invalid otp" })
})
type BodyType = z.infer<typeof otpValidateSchema>

export async function POST(request: NextResponse) {
    try {
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }

        const userData = await prisma.user.findFirst({
            where: { AND: {
                isDeleted: false,
                email: payload.payload.email
            }}
        })

        const body: BodyType = await request.json()
        const validatedData: BodyType = otpValidateSchema.parse(body)
        if(userData?.otp != null || userData?.otpExp != null ) {
            if(!userData?.otpExp || new Date > userData?.otpExp) {
                return NextResponse.json({
                    message: "OTP expired",
                    error: true
                }, { status: 403 })
            }
            if(userData?.otp == validatedData.otp) {
                const update = await prisma.user.update({
                    where: { userId: userData.userId },
                    data: {
                        isVerified: true,
                        otp: null
                    }
                })
                return NextResponse.json({
                    message: "OTP Verified",
                    error: false
                }, { status: 200 })
            }
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