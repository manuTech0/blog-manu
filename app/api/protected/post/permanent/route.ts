import { ApiResponse, User, Post } from '@/lib/types';
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {Promise<NextResponse<ApiResponse<Post<User>>>>}
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Post<User>>>> {
    try {
        const url: URL = new URL(request.url)
        const page: number = parseInt(url.searchParams.get("page") || "1", 2)
        const post = await prisma.post.findMany({
            where: { isDeleted: true },
            skip: ((Number(page) - 1) * 15),
            take: 10,
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        role: true,
                    }
                }
            }
        })
        if(post.length == 0 || post == null) {
            return NextResponse.json({
                message: `Data is empty`,
                error: true
            }, { status: 404 })
        }
        return NextResponse.json({
            message: `Success get data`,
            data: post,
            error: false
        })
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