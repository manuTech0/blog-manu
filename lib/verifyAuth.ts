// Server components
import { NextRequest } from "next/server";
import { apiFetch } from "./apiRequest";

interface User {
    createdAt: Date
    email: string
    fullname: string
    password?: string
    profilePicture?: string
    provider: string
    role?: string
    status?: string
    updateAt: Date
    userId: string
    username: string;
    uniqueId: string;
    verified: boolean
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.manu-tech.my.id"

export async  function verifyAuth(req: NextRequest) {
    const query = `
        query MyQuery {
            me {
                createdAt
                email
                fullname
                profilePicture
                provider
                status
                updateAt
                userId
                username
                verified
            }
        }
    `;
    try {
        const token = req.cookies.get("token")?.value
        const res = (await apiFetch(query, {
            headers: {
                cookie: token ? `token=${token}` : "",
                "Origin": req.headers.get("origin") || "https://blog.manu-tech.my.id"
            }
        })).request
        let user: User | null = null
        let isAuth = false
        if("me" in res) {
            if(res.me) {
                user = res.me as User
                isAuth = true
            }
        }
        return { isAuth, user } as const 
    } catch (_) {
        return { isAuth: false, user: null } as const
    }
}