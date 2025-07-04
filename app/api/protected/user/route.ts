import { User } from "@/lib/generated/prisma";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url: URL = new URL(request.url)
        const page: number = parseInt(url.searchParams.get("page") || '1', 2)
        const user: User[] = await prisma.user.findMany({
            where: { isDeleted: false },
            skip: (page - 1) * 15,
            take: 15,
            include: {
                post: true
            },
        })
        if(user.length == 0 || user == null) {
            return NextResponse.json({
                message: "the User was not found",
                error: true
            }, { status: 404 })
        }
        return NextResponse.json({
            message: "Success get data",
            data: user,
            error: false
        }, { status: 200 })
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