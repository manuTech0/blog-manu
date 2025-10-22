import { apiFetch } from "@/lib/apiRequest";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { ReactNode } from "react";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const param = await params
    try {
        const token = (await cookies()).get("token")?.value
        const res = (await apiFetch(`
            query PostWithUser($username: String!) {
                ByUser(username: $username) {
                    email
                    fullname
                    profilePicture
                    status
                    uniqueId
                    updateAt
                    userId
                    username
                    verified
                    posts {
                        content
                        createdAt
                        postId
                        slug
                        status
                        title
                        updateAt
                        userId
                    }
                }
            }
        `, {
            variables: {
                username: param.username
            },
            headers: {
                cookie: `token=${token}`
            }
        })).request
        if(!res) {
            return { title: "Blog App" }
        }
        return {
            title: res.ByUser.posts[0]?.title,
            description: res.ByUser.posts[0]?.content?.slice(0, 200)
        }
    } catch (e) {
        console.log(e)
        return {
            title: param.username.replaceAll("-", " ")
        }
    }
}

export default function PostByUser({ children }: { children: ReactNode }) {
    return (
        <>{children}</>
    )
}