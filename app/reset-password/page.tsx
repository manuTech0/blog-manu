"use client"

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as React from "react"
import Cookies from "js-cookie"
import { toast } from "sonner"
import axios from "axios"
import { useForm } from "react-hook-form"
import { ZodUser } from "@/lib/allZodSchema"
import z from "zod"
import { ApiResponse, ErrorZod, GenerateTokenType, User } from "@/lib/types"
import { zodErrorValidateToStr } from "@/lib/utils"

const REGEXP_ONLY_DIGITS_AND_UPPERCASE = '^[0-9A-Z]+$'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { resetPasswordSchema } = new ZodUser()

type FormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordWithOtp() {
  const [otp, setOtp] = React.useState("")
  const token = Cookies.get("token")
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>()

  const requestOtp = async () => {
    toast.promise(
      axios.post("/api/auth/otp/request", {}, {
        headers: { "Content-Type": "application/json", "Authorization": "Bearer "+token } 
      }),
      {
        loading: "Requesting OTP...",
        success: (response) => {
          const data: ApiResponse<GenerateTokenType> = response.data
          if(data.error || !data.data) {
            if(data.data as ErrorZod[]) return zodErrorValidateToStr(data.data as ErrorZod[])
            return "Uh oh! Something went wrong: " + data.message
          }
          return "send OTP success"
        },
        error: (err) => (
          err?.response?.data?.message || 
          (process.env.NODE_ENV != "production" ? err?.message : null) ||
          "Terjadi kesalahan saat request OTP."
        )
      }
    )
  }

  const onSubmit = async (data: FormValues) => {
    if (otp.length < 6) {
      toast.error("OTP must be  6 digit")
      return
    }
    toast.promise(
      axios.put("/api/protected/user/password-reset", {
        otp,
        newPassword: data.newPassword
      }, {
        headers: { "Content-Type": "application/json", "Authorization": "Bearer "+token } 
      }),
      {
        loading: "Change password...",
        success: (response) => {
          const data: ApiResponse<User | ErrorZod[]> = response.data
          if(data.error || !data.data) {
            if(data.data as ErrorZod[]) return zodErrorValidateToStr(data.data as ErrorZod[])
            return "Uh oh! Something went wrong: " + data.message
          }
          return "Password success changed"
        },
        error: (err) => (
          err?.response?.data?.message || 
          (process.env.NODE_ENV != "production" ? err?.message : null) ||
          "Terjadi kesalahan saat reset password."
        )
      }
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 p-6 rounded-2xl bg-card text-card-foreground shadow-lg border border-border">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Reset Password</h2>
          <p className="text-sm text-muted-foreground">
            Masukkan password baru dan verifikasi OTP di bawah.
          </p>
        </div>

        {/* Form Password */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Password Baru"
              {...register("newPassword", { required: "Password wajib diisi", minLength: { value: 6, message: "Minimal 6 karakter" } })}
            />
            {errors.newPassword && <p className="text-red-500 text-sm">{errors.newPassword.message}</p>}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Ulangi Password"
              {...register("newRetryPassword", { 
                required: "Konfirmasi password wajib diisi",
                validate: (value) => value === watch("newPassword") || "Password tidak cocok"
              })}
            />
            {errors.newRetryPassword && <p className="text-red-500 text-sm">{errors.newRetryPassword.message}</p>}
          </div>

          {/* OTP Input */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)} pattern={REGEXP_ONLY_DIGITS_AND_UPPERCASE}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Button
                type="button"
                variant="outline"
                onClick={() => requestOtp()}
              >
                Resend
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={otp.length < 6}
              >
                Save Password
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
