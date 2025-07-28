import { logger } from "@/lib/logger"
import prisma from "@/lib/prisma"
import { ApiResponse, ErrorZod, Post } from "@/lib/types"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const recoveryPostSchema = z.array(z.number().min(1))

type RecoveryBodyType = z.infer<typeof recoveryPostSchema>


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {(Promise<NextResponse<ApiResponse<Post | ErrorZod[]>>>)}
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<Post | ErrorZod[]>>> {
    try {
        const body: RecoveryBodyType = await request.json()
        const validatedData = recoveryPostSchema.parse(body)

        const responseCreate = await prisma.post.updateMany({
            where: { postId: { in: validatedData } },
            data: {
                isDeleted: false
            }
        })
        return NextResponse.json({
            message: "Success deleted with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
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