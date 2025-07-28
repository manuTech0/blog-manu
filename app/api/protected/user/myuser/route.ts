import { isTokenError, verifyToken } from "@/lib/jwt"
import { logger } from "@/lib/logger"
import prisma from "@/lib/prisma"
import { ApiResponse, User } from "@/lib/types"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {Promise<NextResponse<ApiResponse<User>>>}
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<User>>> {
    try {
        const token = (await cookies()).get("token")?.value || (request.headers.get("Authorization"))?.split(" ")[1]
        const payload = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        const user = await prisma.user.findUnique({
            where: { email: payload.payload.email },
            select: {
              username: true,  
              email: true,
              uniqueId: true,
              createdAt: true,
            }
        })
        if(user) {
            return NextResponse.json({
                message: "Success get user",
                data: user,
                error: false
            }, { status: 200 })
        }
        return NextResponse.json({
            message: "User not defined",
            error: true
        }, { status: 404 })
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