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
import type { LoginResponse, GenerateTokenType } from "@/lib/types"
import Cookies from "js-cookie"
import { durationToUnix } from "@/lib/utils"
import { useRouter } from "next/navigation"


// ✅ Schema validasi
const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string()
})

// ✅ Type data
type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [cookieValue, setCookieValue] = useState<GenerateTokenType | undefined>(undefined)
  const [tokenCookie, setTokenCookie] = useState<string | undefined>(undefined)
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  })
  useEffect(() => {
    if(cookieValue) {
      const expiresUnix = durationToUnix(cookieValue.expires_in)
      const setToken = Cookies.set("token", cookieValue.access_token, {
        expires: expiresUnix,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV == "production",
      })
      setTokenCookie(setToken)
    }
  }, [cookieValue])

  function sendRequest(values: LoginFormData) {
    toast.promise(axios.post("/api/auth/login", {
      email: values.email,
      password: values.password,
    }, {
      headers: { "Content-Type": "application/json" } 
    }), {
      loading: "Verifications....",
      success: async (response) => {
        const apiLogin: LoginResponse = response.data
        if(!apiLogin.error && apiLogin.data as GenerateTokenType) {
          setCookieValue(apiLogin.data as GenerateTokenType)
          if(tokenCookie) {
            setTimeout(() => {
              router.replace("/dashboard")
            }, 800)
            return "Login success"
          } else {
            return "Login error, failed create cookie"
          }
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
        setErrorMsg(error)
        return error
      }
    })
    
  }
  

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6 p-6 border rounded-2xl shadow-lg bg-white dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-center text-foreground">Login</h1>

        {/* Alert Error */}
        {errorMsg && (
          <Alert variant="destructive">
            <TriangleAlertIcon className="h-4 w-4" />
            <AlertTitle>Login gagal</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(sendRequest)} className="space-y-5">
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
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <button
          className="underline text-primary"
          onClick={() => router.replace("/register")}
          >
          Register here
          </button>
        </div>
      </div>
    </div>
  )
}

