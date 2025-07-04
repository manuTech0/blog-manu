import { sendOTP } from "@/lib/email";
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { JWTVerifyResult } from "jose";
import { NextResponse } from "next/server";

export async function POST(request: NextResponse) {
    try {
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }

        const response = await sendOTP(payload.payload.email)
        if(response.error) throw new Error(response.message, { cause: response.data });
         const expiresOTP = new Date(Date.now() + (60 * 10 * 1000))
         const update = await prisma.user.update({
            where: { email: payload.payload.email },
            data: {
                otp: response.otp,
                otpExp: expiresOTP
            }
         })
         logger.info(update)
         return NextResponse.json({
                message: "OTP Succes sending",
                error: false
         }, { status: 400 })
    } catch (error) {
        if(error instanceof Error) {
            const errorReport = logger.error("Unknown error", error)
            return NextResponse.json({
                message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
                error: true
            }, { status: 500 } )
        }
    }
}