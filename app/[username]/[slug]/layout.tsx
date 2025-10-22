import { apiFetch } from "@/lib/apiRequest";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { ReactNode } from "react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const param = await params
    try {
        const token = (await cookies()).get("token")?.value
        const res = (await apiFetch(`
            query PostBySlug($slug: String!) {
                BySlug(slug: $slug) {
                    content
                    createdAt
                    postId
                    slug
                    status
                    title
                    updateAt
                    userId
                    user {
                    username
                    }
                }
            }
        `, {
            variables: {
                slug: param.slug
            },
            headers: {
                cookie: `token=${token}`
            }
        })).request
        if(!res) {
            return { title: "Blog App" }
        }
        return {
            title: res.BySlug.title,
            description: res.BySlug.content.slice(0, 200)
        }
    } catch (e) {
        return {
            title: param.slug?.replaceAll("-", " ")
        }
    }
}

export default function PostBySlug({ children }: { children: ReactNode }) {
    return (
        <>{children}</>
    )
}