"use client"
import axios from "axios";
import { useEffect, useState } from "react";
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

export function useAuth() {
    const [isAuth, setIsAuth] = useState(false)
    const [loading, setLoadoing] = useState(true)
    const [user, setUser] = useState<User | undefined>(undefined)
    useEffect(() => {
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
                    uniqueId
                }
            }
        `;
        (async () => {
            try {
                const res = await (await apiFetch(query)).request
                if("me" in res) {
                    if(res.me) {
                        setIsAuth(true)
                        setUser(res.me)
                    }
                }
                setLoadoing(false)
            } catch (_) {
                setIsAuth(false)
                setUser(undefined)
                setLoadoing(false)
            }
        })()
    }, [])
    return { isAuth, user, loading } as const
}