import { CreateEmailResponse, Resend } from "resend";
import { logger } from "./logger";
import OTP from "otp-generator"

interface Options {
    type: "otp" | "other",
    message?: string;
    target: string;
}
interface EmailSendResponse {
    message: string;
    error: boolean;
    id?: string;
    data?: object;
    otp?: string;
}

export async function sendOTP(target: string): Promise<EmailSendResponse> {
    const resend = new Resend(process.env.RESEND_API_KEY)
    let res: Awaited<ReturnType<typeof resend.emails.send>>
     const otp = await OTP.generate(6, {
        digits: true,
        upperCaseAlphabets: true,
        specialChars: false,
        lowerCaseAlphabets: false
    })
    const message = String(`<html><h1>${otp}</h1></html>`).toUpperCase()
    if(process.env.NODE_ENV == "production") {
        res = await resend.emails.send({
            from:  "onboarding@resend.dev",
            to: target,
            subject: "Your OTP code",
            html: message || "Text"
        })
    } else {
        res = await resend.emails.send({
            from:  "onboarding@resend.dev",
            to: "delivered@resend.dev",
            subject: "Your OTP code",
            html: message || "Text"
        })
    }
    if(res.error) {
        return {
            message: "Vailed send OTP",
            data: res.error,
            error: true
        }
    }
    return {
        message: "Success send OTP",
        error: false,
        id: res.data?.id,
        otp: otp
    }
}
