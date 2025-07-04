import { User } from "@/lib/generated/prisma";
import { generateUniqueId } from "@/lib/generateId";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import argon2 from "argon2";
import { addMonths, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"

const bodySchema = z.object({
    username: z.string().min(4, { message: "The username must be more than 4 characters" }).max(110, { message: "The username must not exceed 110 characters" }).superRefine(async (value: string, ctx) => {
        const username: number = await prisma.user.count({
            where: { username: value }
        })

        if (username > 0){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The username already taken",
                path: ["username"]
            })
        }
    }),
    email: z.string().email({ message: "invalid email addredd" }).max(80, { message: "The email must not exceed 80 characters" }).superRefine(async (value: string, ctx) => {
        const email: number = await prisma.user.count({
            where: { email: value }
        })

        if (email > 0){
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The email already taken",
                path: ["email"]
            })
        }
    }),
    password: z.string().min(8, { message: "The password must be at least 8 charcaters long" })
        .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "The password must contain at least one number" })
})

type BodyRegister = z.infer<typeof bodySchema>

export async function POST(request: NextRequest) {
    try {
        const body: BodyRegister = await request.json()

        const validatedData: BodyRegister = await bodySchema.parseAsync(body)

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

        return NextResponse.json({ 
            message: "Success create user",
            data: {
                uniqueId: update.uniqueId,
                email: update.email,
                otp: update.otp,
                role: update.role
            },
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