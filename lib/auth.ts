import { JWTVerifyResult } from "jose"
import { cookies } from "next/headers"
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "./jwt"
import prisma from "./prisma"

export async function getUserFromToken() {
    try {
        const token = (await cookies()).get("token")?.value
        if(!token) return null
        const decode: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token)
        if(isTokenError(decode)) {
            return null
        }
        const user = await prisma.user.findFirst({
            where: { AND: {
                isDeleted: false,
                email: decode.payload.email
            }}
        })
        return user
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return null
    }
}
export async function isAdmin() {
    const user = await getUserFromToken()
    return user?.role == "ADMIN"
}