"use client"

import React, { useEffect, useState } from "react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import type { GenerateTokenType, ErrorZod, ApiResponse } from "@/lib/types"
import Cookies from "js-cookie"
import { durationToUnix, zodErrorValidateToStr } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Registration"
}

// ✅ Zod validation schema
const registerSchema = z.object({
  username: z.string().min(4, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password:  z.string().min(8, { message: "The password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "The password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "The password must contain at least one number" }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

// ✅ Type
type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [cookieValue, setCookieValue] = useState<GenerateTokenType | undefined>(undefined)
  const router = useRouter()

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    },
  })

  useEffect(() => {
    if (cookieValue) {
      const expiresUnix = durationToUnix(cookieValue.expires_in)
      Cookies.set("token", cookieValue.access_token, {
        expires: expiresUnix,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      })
    }
  }, [cookieValue])

  function sendRequest(values: RegisterFormData) {
    toast.promise(axios.post("/api/auth/register", {
      username: values.username,
      email: values.email,
      password: values.password
    }, {
      headers: { "Content-Type": "application/json" }
    }), {
      loading: "Registering account...",
      success: async (response) => {
        const apiRes: ApiResponse = response.data
        if (!apiRes.error && apiRes.data as GenerateTokenType) {
          setCookieValue(apiRes.data as GenerateTokenType)
          if (Cookies.get("token")) {
            setTimeout(() => router.replace("/dashboard"), 800)
            return "Registration successful!"
          } else {
            return "Registration succeeded, but failed to store token."
          }
        } else {
          const dataValidate = apiRes.data as ErrorZod[]
          return apiRes.message + "\n" + zodErrorValidateToStr(dataValidate) || "Registration failed."
        }
      },
      error: (err) => {
        const error = (
          err?.response?.data?.message ||
          (process.env.NODE_ENV !== "production" ? err?.message : null) ||
          "An unexpected error occurred during registration."
        )
        setErrorMsg(error)
        return JSON.stringify(err?.response?.data)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6 p-6 border rounded-2xl shadow-lg bg-white dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-center text-foreground">Create Account</h1>

        {/* Alert Error */}
        {errorMsg && (
          <Alert variant="destructive">
            <TriangleAlertIcon className="h-4 w-4" />
            <AlertTitle>Registration Failed</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(sendRequest)} className="space-y-5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="yourname" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Register
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
            className="underline text-primary"
            onClick={() => router.replace("/login")}
            >
            Login here
            </button>
        </div>
      </div>
    </div>
  )
}
