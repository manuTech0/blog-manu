import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { ApiResponse, Post, User } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {Promise<NextResponse<ApiResponse<User<Post>>>>}
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<User<Post>>>> {
    try {
        const url: URL = new URL(request.url)
        const page: number = parseInt(url.searchParams.get("page") || '1', 2)
        const user = await prisma.user.findMany({
            where: {
                isDeleted: false,
            },
            skip: (page - 1) * 15,
            take: 15,
            select: {
                userId: true,
                username: true,
                email: true,
                uniqueId: true,
                role: true,
                isVerified: true,
                isBanned: true,
                createdAt: true,
                updateAt: true,
                post: true,
            }
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
