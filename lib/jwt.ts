import { importPKCS8, importSPKI, JWTPayload, jwtVerify, JWTVerifyResult, SignJWT } from "jose";
import { JOSEAlgNotAllowed, JWSSignatureVerificationFailed, JWTExpired, JWTInvalid } from "jose/errors";
import { logger } from "./logger";
import { GenerateTokenType } from "./types";

export interface TokenError{
    error: boolean;
    message: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isTokenError(token: any): token is TokenError {
    return (
        token &&
        typeof token === 'object' &&
        typeof token.error === 'boolean' &&
        (typeof token.message === "string" || typeof token.message === "undefined")
    )
}

interface Payload {
    email: string;
    role: "USER" | "ADMIN";
    isverified: boolean;
}
export type CustomJWTPayload = JWTPayload & Payload

const privateKey = await importPKCS8(process.env.PRIVATE_KEY_FILE || "private", "ES256")
export const publicKey = await importSPKI(process.env.PUBLIC_KEY_FILE || "public", "ES256")

export async function generateToken(payload: CustomJWTPayload, expiresIn: string = "1d" /* 1 days */, otp: string | null = null): Promise<GenerateTokenType | TokenError> {
    try {
        const exp = (otp != null) ? new Date().getTime() + 60 * 10 * 1000 : 0
        const token: string = await new SignJWT({ ...payload, otp: otp, otpExp: exp})
            .setExpirationTime(expiresIn)
            .setProtectedHeader({ alg: "ES256" })
            .setIssuedAt()
            .sign(privateKey)
        return {
            access_token: Buffer.from(token, "utf-8").toString("base64"),
            expires_in: expiresIn,
            token_type: "Bearer"
        }
    } catch (error) {
        if(error instanceof TypeError) {
            return {
                error: true,
                message: `Argument JWT sign invalid : ${error.message}`
            }
        } else if(error instanceof JWTInvalid) {
            return {
                error: true,
                message: `JWT key invalid : ${error.message}` 
            }
        }
        logger.error(error)
        return {
            error: true,
            message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime()
        }
    }
}

export async function verifyToken(token: string): Promise< JWTVerifyResult<CustomJWTPayload> | TokenError> {
    try {
        const realToken: string = Buffer.from(token, "base64url").toString("utf8")
        const decoded: JWTVerifyResult<CustomJWTPayload> = await jwtVerify(realToken, publicKey, {
            algorithms: ["ES256"]
        })
        return decoded
    } catch (error) {
        if (error instanceof JWTExpired) {
            return {
                error: true,
                message: `JWT token expired : ${error.message}`
            }
        } else if(error instanceof JWTInvalid) {
            return {
                error: true,
                message: `JWT token invalid : ${error.message}`
            }
        } else if(error instanceof JWSSignatureVerificationFailed) {
            return {
                error: true,
                message: `JWT token not suitable : ${error.message}`
            }
        } else if(error instanceof JOSEAlgNotAllowed) {
            return {
                error: true,
                message: `Alogoritms not allowed : ${error.message}`
            }
        } else if(error instanceof JWTInvalid || error instanceof TypeError) {
            return {
                error: true,
                message: `JWT verifycation was invalid : ${error.message}`
            }

        }
        logger.error(error)
        return {
            error: true,
            message: "Unknown error, please report to admin or customer service, time error: " + new Date().getTime()
        }

    }
}
