import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger";
import { ApiResponse, ApiWithPaginating, Post, User } from "@/lib/types";


/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @param {{ params: Promise<{ param: string }> }} { params }
 * @return {*}  {(Promise<NextResponse<ApiResponse<Post<User>[] | ApiWithPaginating<Post<User>>>>>)}
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ param: string }> }): Promise<NextResponse<ApiResponse<Post<User>[] | ApiWithPaginating<Post<User>>>>> {
    try {
        const { param } = await params
        const userOmit = {
            password: true,
            otp: true,
        }
        let posts: Post<User>[] | null = []

        let post = await prisma.post.findFirst({
            where: {
                isDeleted: false,
                slug: param,
                user: {
                isBanned: false,
                },
            },
            include: {
                user: {
                    omit: userOmit, 
                },
            },
        })

        if (!post) {
            post = await prisma.post.findFirst({
                where: {
                    isDeleted: false,
                    user: {
                        isBanned: false,
                        username: param,
                    },
                },
                include: {
                    user: {
                        omit: userOmit,
                    },
                },
            })
        }

        if (!post && !isNaN(Number(param))) {
            posts = await prisma.post.findMany({
                where: {
                    isDeleted: false,
                    userId: Number(param),
                    user: {
                        isBanned: false,
                    },
                },
                include: {
                    user: {
                        omit: userOmit,
                    },
                },
            })
        }

        if(!post && !posts ) {
            return NextResponse.json({
                message: `Data is empty`,
                error: true
            }, { status: 404 })
        }
        let totalItems: number = 1
        if(!isNaN(Number(param))) {
            totalItems = await prisma.post.count({
                where: {
                    isDeleted: false,
                    user: {
                        isBanned: false,
                    },
                    userId: Number(param)
                }
            })
        }
        return NextResponse.json({
            message: `Success get data`,
            data: !(posts && !isNaN(Number(param))) ? post : {
                data: posts,
                totalPage: Math.ceil((totalItems / 12))
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
