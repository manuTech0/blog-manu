import { User } from "@/lib/generated/prisma";
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { JWTVerifyResult } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DeleteDataScheama = z.array(z.number().min(1))

type DeleteData = z.infer<typeof DeleteDataScheama>

export async function GET(request: NextRequest) {
    try {
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        if(payload.payload.role == "ADMIN") {
            const url: URL = new URL(request.url)
            const page: Number = parseInt(url.searchParams.get("page") || "1", 2)
            const user: User[] = await prisma.user.findMany({
                where: { isDeleted: true },
                skip: ((Number(page) - 1) * 15),
                take: 10
            })
            if(user.length == 0 || user == null) {
                return NextResponse.json({
                    message: `Data is empty`,
                    error: true
                }, { status: 404 })
            }
            return NextResponse.json({
                message: `Success get data`,
                data: user,
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
export async function DELETE(request: NextRequest) {
    try {
        const token: string | null | undefined = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(' ')[1]
        const payload: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token || "token")
        if(isTokenError(payload)) {
            return NextResponse.json(payload, { status: 501 })
        }
        if(payload.payload.role == "ADMIN") {
            const body: DeleteData = await request.json()
            const validatedData = DeleteDataScheama.parse(body)

            const responseDelete = await prisma.user.deleteMany({
                where: { userId: { in: validatedData } }
            })
            return NextResponse.json({
                messgae: "Success deleted with data :",
                data: responseDelete,
                error: false
            }, { status: 200 })
        } else {
            return NextResponse.json({
                messae: "Access not granted",
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