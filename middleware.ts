import { NextURL } from "next/dist/server/web/next-url";
import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "./lib/verifyAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { isAuth, user } = await verifyAuth(request);

  if (pathname.startsWith("/account")) {
    if (isAuth && user) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: [
    "/login",
    "/otp",
    "/logout",
    "/dashboard/:path*",
    "/account",
    "/account/:path"
  ],
  
};