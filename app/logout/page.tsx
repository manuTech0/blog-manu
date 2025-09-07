"use client"
import { useEffect } from "react";
import Cookies from "js-cookie"
import { useRouter } from "next/navigation";

export default function Logout() {
    const router = useRouter()
    useEffect(() => {
        Cookies.remove("token")
        if(!Cookies.get("token")) {
            return router.replace("/")
        }
    }, [])
}