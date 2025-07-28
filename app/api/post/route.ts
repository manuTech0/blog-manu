import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger";
import { ApiResponse, ApiWithPaginating, Post, User } from "@/lib/types";


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {Promise<NextResponse<ApiResponse<ApiWithPaginating<Post<User>[]>>>>}
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ApiWithPaginating<Post<User>[]>>>> {
    try {
        const url: URL = new URL(request.url)
        const page: number = parseInt(url.searchParams.get("page") || "1", 10)
        const post = await prisma.post.findMany({
            where: { 
                isDeleted: false,
                user: {
                    isBanned: false,
                },
            },
            skip: ((Number(page) - 1) * 12),
            take: 12,
            include: {
                user: {
                    omit: {
                        otp: false,
                        password: false
                    }
                }
            }
        })
        const totalItems = await prisma.post.count({
            where: {
                isDeleted: false,
                user: {
                    isBanned: false,
                }
            }
        })
        if(post.length == 0 || post == null) {
            return NextResponse.json({
                message: `Data is empty`,
                error: true
            }, { status: 404 })
        }
        const totalPage = Math.ceil(totalItems / 12)
        return NextResponse.json({
            message: `Success get data`,
            data: {
                data: post,
                totalPage: totalPage
            },
            error: false
        })
    } catch (error) {
        if(error instanceof Error) {
            logger.error(error)
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
