"use client"

import { useAuth } from "@/lib/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.manu-tech.my.id"

export default function Login() {
    const router = useRouter()
    const { isAuth, user } = useAuth()
    useEffect(() => {
        const redirectUrl = window.location.origin + "/sign"
        if(isAuth) {
            router.push("/app")
        } else {
            router.replace(apiUrl + "/?redirect_url=" + redirectUrl)
        }
    }, [])

    return (
        <a href={apiUrl}>Redirect to auth</a>
    )
}