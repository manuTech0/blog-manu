import { NextURL } from "next/dist/server/web/next-url";
import { NextRequest, NextResponse } from "next/server";
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "./lib/jwt";
import { JWTPayload, JWTVerifyResult } from "jose";
import { logger } from "./lib/logger";
 export async function middleware(request: NextRequest) {
    const token: string | undefined = request.cookies.get('token')?.value || request.headers.get('Authorization')?.split(' ')[1]
    const url: NextURL = request.nextUrl.clone()

    // if(url.pathname.startsWith("/api/protected") && !token) {
    //     return NextResponse.json({
    //         message: "Token not found"
    //     }, { status: 401 })
    // }
    // if(url.pathname.startsWith("/api/protected/user/admin") && token) {
    //     try {
    //         const decode: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token)
    //         if(isTokenError(decode)) {
    //             return NextResponse.json(JSON.stringify(decode), { status: 401 })
    //         }
    //         if(decode.payload.role == 'ADMIN') {
    //             return NextResponse.next()
    //         } else {
    //             return NextResponse.json({
    //                 message: "Not access",
    //                 error: true
    //             }, { status: 401 })
    //         }
    //     } catch (error) {
    //         logger.error("Unknown error", error)
    //         return NextResponse.json({
    //             message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
    //             error: true
    //         }, { status: 500 } )
    //     }
    // }
    // if(/*url.pathname.startsWith("/api/protected") && token*/ true) {
    //     try {
    //         const decode: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token)
    //         if(isTokenError(decode)) {
    //             return NextResponse.json(decode, { status: 401 })
    //         }
    //         return NextResponse.next()
    //     } catch (error) {
    //         logger.error("Unknown error", error)
    //         return NextResponse.json({
    //             message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
    //             error: true
    //         }, { status: 500 } )
    //     }
    // }
    // if(url.pathname.startsWith("/dashboard") && token) {
    //     try {
    //         const decode: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token)
    //         if(isTokenError(decode)) {
    //             return NextResponse.json(decode, { status: 401 })
    //         }
    //         if(true /*decode.payload.role == 'ADMIN' */) {
    //             return NextResponse.next()
    //         } else {
    //             return NextResponse.json({
    //                 message: "Not access",
    //                 error: true
    //             }, { status: 401 })
    //         }
    //     } catch (error) {
    //         logger.error("Unknown error", error)
    //         return NextResponse.json({
    //             message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime(),
    //             error: true
    //         }, { status: 500 } )
    //     }
    // }
 }

 export const config = {
    matcher: ['/api/protected/:path', '/dashboard/:path', '/administrator/:path'] 
 }