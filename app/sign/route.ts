import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const tokenCookie = (await cookies()).get("token")?.value
    if(tokenCookie) {
        const token: {
            access_token: string,
            expires_in: Date,
            token_type: string
        } = JSON.parse(tokenCookie)
        if(token.access_token) {
            return NextResponse.redirect(new URL("/account", req.url))
        }
    }
    return NextResponse.json({
        error: true,
        message: "Invalid Token"
    })
}