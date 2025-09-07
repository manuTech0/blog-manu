import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger";
import { ApiResponse, Post, User } from "@/lib/types";


/**
 *
 *
 * @export
 * @return {*}  {Promise<NextResponse<ApiResponse<Post<User>[]>>>}
 */
export async function GET(): Promise<NextResponse<ApiResponse<Post<User>[]>>> {
    try {
        const post = await prisma.post.findMany({
            where: { 
                isDeleted: false,
                user: {
                    isBanned: false,
                },
            },
            include: {
                user: {
                    omit: {
                        otp: false,
                        password: false
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
