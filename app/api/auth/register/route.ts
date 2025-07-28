import { ZodAuth } from "@/lib/allZodSchema";
import { User } from "@/lib/generated/prisma";
import { generateUniqueId } from "@/lib/generateId";
import { CustomJWTPayload, generateToken, isTokenError, TokenError } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { ApiResponse, ErrorZod, GenerateTokenType } from "@/lib/types";
import argon2 from "argon2";
import { addMonths, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"

const { regisSchema } = new ZodAuth()

type RegisType = z.infer<typeof regisSchema>




/**
 *
 *
 * @export
 * @param {NextRequest} request
 * @return {*}  {(Promise<NextResponse<ApiResponse<string | ErrorZod[]>>>)}
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<string | ErrorZod[]>>> {
    try {
        const body = await request.json()

        const validatedData: RegisType = await regisSchema.parseAsync(body)

        const hashedPassword: string = await argon2.hash(validatedData.password, { secret: Buffer.from(process.env.ARGON2_SECRET || "secret") })

        const response = await prisma.user.create({
            data: {
                username: validatedData.username,
                email: validatedData.email,
                password: hashedPassword,
                otp: ""
            },
            select: {
                userId: true
            }
        })

        const now: Date = new Date()
        const start: Date = startOfMonth(now)
        const end: Date = addMonths(startOfMonth(now), 1)

        const users: User[] = await prisma.user.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lt: end
                }
            }
        })

        const id: string = generateUniqueId(users, response.userId)
        const update = await prisma.user.update({
            where: { userId: response.userId },
            data: {
                uniqueId: id
            }
        })

        const payload: CustomJWTPayload = {
            email: update.email,
            role: update.role,
            iss: process.env.API_URL || "my-blog.com",
            sub: update.uniqueId || String(update.userId),
            aud: update.username,
            iat: new Date().getTime(),
            jti: update.uniqueId || String(update.userId),
            isverified: update.isVerified
        }
        const token: GenerateTokenType | TokenError = await generateToken(payload, "14d")
        if(isTokenError(token)) {
            return NextResponse.json({
                message: "Error get token",
                data: token,
                error: true
            }, { status: 401 })
        } else {
            return NextResponse.json({
                message: "Success get token",
                data: token,
                error: false
            }, { status: 200 })
        }       
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
            message: "Unknown error",
            error: true
        })
    }
}