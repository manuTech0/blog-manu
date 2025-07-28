import { CustomJWTPayload, verifyToken, TokenError, isTokenError } from "@/lib/jwt"
import { logger } from "@/lib/logger"
import prisma from "@/lib/prisma"
import { ApiResponse, ErrorZod, User } from "@/lib/types"
import { JWTVerifyResult } from "jose"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const recoveryUsersSchema = z.array(z.number().min(1))

type RecoveryBodyType = z.infer<typeof recoveryUsersSchema>

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
        if(payload.payload.role == "ADMIN") {
          const body: RecoveryBodyType = await request.json()
          const validatedData = recoveryUsersSchema.parse(body)
          
          const responseCreate = await prisma.user.updateMany({
              where: { userId: { in: validatedData } },
              data: {
                  isDeleted: false
              }
          })
          return NextResponse.json({
              message: "Success deleted with data :",
              data: responseCreate,
              error: false
          }, { status: 200 })
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
