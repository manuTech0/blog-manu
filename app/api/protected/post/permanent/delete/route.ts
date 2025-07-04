import { logger } from "@/lib/logger"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const DeleteDataScheama = z.array(z.number().min(1))

type DeleteData = z.infer<typeof DeleteDataScheama>

export async function DELETE(request: NextRequest) {
    try {
        const body: DeleteData = await request.json()
        const validatedData = DeleteDataScheama.parse(body)

        const responseCreate = await prisma.post.deleteMany({
            where: { postId: { in: validatedData } }
        })
        return NextResponse.json({
            messgae: "Success deleted with data :",
            data: responseCreate,
            error: false
        }, { status: 200 })
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