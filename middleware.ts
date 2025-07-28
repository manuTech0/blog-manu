import { MiddlewareConfig, NextRequest, NextResponse } from "next/server";
import { NextURL } from "next/dist/server/web/next-url";
import { CustomJWTPayload, isTokenError, TokenError, verifyToken } from "./lib/jwt";
import { JWTVerifyResult } from "jose";

interface ErrorExtra {
  type: "api" | "web";
}

type AuthUrlErrorOptions = ErrorExtra & ErrorOptions;

class AuthUrlError extends Error {
  public type: "api" | "web";

  constructor(message: string, options?: AuthUrlErrorOptions) {
    super(message);
    this.name = "AuthUrlError";
    this.type = options?.type || "web";
  }
}

function isPublicPath(pathname: string): boolean {
  return ["/", "/login", "/register", "/otp", "/logout", "/notfound"].some(p =>
    pathname.startsWith(p)
  );
}

async function authUrl(
  { pathname }: NextURL,
  token: string | undefined,
  request: NextRequest
): Promise<NextResponse> {
  try {
    if (isPublicPath(pathname) && !token) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/notfound", request.url));
    }

    const decode: JWTVerifyResult<CustomJWTPayload> | TokenError = await verifyToken(token);

    if (isTokenError(decode)) {
      if (isPublicPath(pathname)) {
        return NextResponse.next();
      } else {
        throw new AuthUrlError("Auth error: " + decode.message, { type: "web" });
      }
    }

    const { role, isverified } = decode.payload;
    const isAdmin = role === "ADMIN";
    const isUser = role === "USER";

    if (pathname.startsWith("/api/protected")) {
      if ((isAdmin || isUser) && isverified) return NextResponse.next();
      return NextResponse.redirect(new URL("/otp", request.url));
    }

    if (pathname.startsWith("/api/protected/user/admin")) {
      if (isAdmin && isverified) return NextResponse.next();
      return NextResponse.redirect(new URL("/otp", request.url));
    }

    if (pathname.startsWith("/admin")) {
      if (isAdmin && isverified) return NextResponse.next();
      return NextResponse.redirect(new URL("/otp", request.url));
    }
    if (pathname.startsWith("/dashboard")) {
      if(isverified && (isUser || isAdmin)) return NextResponse.next()
      return NextResponse.redirect(new URL("/notfound", request.url))
    }

    if (pathname.startsWith("/otp")) {
      if (isverified) {
        return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", request.url));
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
      if (isverified) {
        return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/otp", request.url));
      }
    }

    if (pathname.startsWith("/logout")) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL("/notfound", request.url));

  } catch (error) {
    if (error instanceof AuthUrlError) {
      if (error.type === "api") {
        return NextResponse.json({ message: error.message }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL("/notfound", request.url));
      }
    }

    console.error("Unhandled middleware error:", error);
    return NextResponse.redirect(new URL("/notfound", request.url));
  }
}

export async function middleware(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(" ")[1];
  const url = request.nextUrl.clone();
  return authUrl(url, token, request);
}

export const config: MiddlewareConfig = {
  matcher: [
    "/login",
    "/register",
    "/otp",
    "/logout",
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/protected/:path*",
  ],
  
};
