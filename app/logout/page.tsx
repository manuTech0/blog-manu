"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { LogOutIcon } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.manu-tech.my.id"


export default function Logout() {
    const router = useRouter()
    useEffect(() => {
        const logout = axios.post(apiUrl + "/auth/logout", {}, {
            withCredentials: true
        })
        toast.promise(logout, {
            loading: <div>Logout <LogOutIcon className="animate-bounce" /></div>,
            success: (res) => {
                const { data } = res
                setTimeout(() => {
                    router.replace("/")
                }, 200);
                if(data.logout && data.logout == true) {
                    return "Success logout"
                } else {
                    return "not logged"
                }
            },
            error: () => {
                setTimeout(() => {
                    router.replace("/")
                }, 200);
                return "Failed logout"
            }
        })
    }, [])
}