import { ZodUser } from "@/lib/allZodSchema"
import { CustomJWTPayload, TokenError, isTokenError, verifyToken } from "@/lib/jwt"
import { logger } from "@/lib/logger"
import prisma from "@/lib/prisma"
import { ApiResponse, ErrorZod, User } from "@/lib/types"
import { JWTVerifyResult } from "jose"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import z from "zod"


const { updateUserSchema } = new ZodUser()


type UpdateUserTypeBody = z.infer<typeof updateUserSchema>


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
                userId: true,
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


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @param {{ params: Promise<{ userId : string }>}} { params }
 * @return {*}  {(Promise<NextResponse<ApiResponse<User | ErrorZod[]>>>)}
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<User | ErrorZod[]>>> {
    try {
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        const isUser = await prisma.user.findUnique({ where: { email: payload.payload.email } })
        if(isUser && isUser.email === payload.payload.email) {
            const putBody: UpdateUserTypeBody = await request.json()
            const validatedData: UpdateUserTypeBody = await updateUserSchema.parseAsync(putBody)
            const update = await prisma.user.update({
                where: { userId: isUser.userId },
                data: {
                    email: validatedData.email,
                    username: validatedData.username,
                    role: validatedData.role
                },
                omit: { password: true, otp: true }
            })
            return NextResponse.json({
                message: `Success update data with userId=${isUser.userId}`,
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