"use client"

import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import * as React from "react"
import Cookies from "js-cookie"
import { toast } from "sonner"
import axios from "axios"
import { ApiResponse, GenerateTokenType } from "@/lib/types"
import { durationToUnix } from "@/lib/utils"
import { useRouter } from "next/navigation"

const REGEXP_ONLY_DIGITS_AND_UPPERCASE = '^[0-9A-Z]+$';

export default function OtpVerify() {
  const [value, setValue] = React.useState("")
  const [cookieValue, setCookieValue] = React.useState<GenerateTokenType | undefined>(undefined)
  const router = useRouter()
  const token = Cookies.get("token")
  const requestOtp = async () => {
    toast.promise(axios.post("/api/auth/otp/request", {}, {
      headers: { "Content-Type": "application/json", "Authorization": "Bearer "+token } 
    }), {
      loading: "Requesting....",
      success: async () => {
          return "Success send otp"
      },
      error: (err) => {
        const error = (
          err?.response?.data?.message || 
          (process.env.NODE_ENV != "production" ? err?.message : null) ||
          "Terjadi kesalahan saat login."
        )
        return error
      }
    })
  }
  const verifyOTP = async () => {
    toast.promise(axios.post("/api/auth/otp/validate", {
      otp: value
    }, {
      headers: { "Content-Type": "application/json", "Authorization": "Bearer "+token } 
    }), {
      loading: "Validateing....",
      success: async (response) => {
          const apiLogin: ApiResponse<string> = response.data
          if(!apiLogin.error && apiLogin.data as GenerateTokenType) {
            setCookieValue(apiLogin.data as GenerateTokenType)
            return "Success logged"
          } else {
            return apiLogin.message
          }
      },
      error: (err) => {
        const error = (
          err?.response?.data?.message || 
          (process.env.NODE_ENV != "production" ? err?.message : null) ||
          "Terjadi kesalahan saat login."
        )
        return error
      }
    })
  }

  React.useEffect(() => {
    if(cookieValue) {
      const expiresUnix = durationToUnix(cookieValue.expires_in)
      Cookies.set("token", cookieValue.access_token, {
        expires: expiresUnix,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV == "production",
      })
      router.replace("/dashboard")
    }
  }, [cookieValue])
  React.useEffect(() => {
    requestOtp()
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 p-6 rounded-2xl bg-card text-card-foreground shadow-lg border border-border">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Verifikasi OTP</h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code we sent you.
          </p>
        </div>

        {/* Input OTP */}
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={value} onChange={(val) => setValue(val)} pattern={REGEXP_ONLY_DIGITS_AND_UPPERCASE}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Tombol Aksi */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            disabled={value.length < 6}
            onClick={() => verifyOTP()}
          >
            Verify
          </Button>
          <Button
            variant="outline"
            className="text-primary hover:text-primary-foreground"
            onClickCapture={() => requestOtp()}
          >
            Resend
          </Button>
        </div>
      </div>
    </div>
  )
}
