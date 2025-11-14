import { apiFetch } from "@/lib/apiRequest";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { ReactNode } from "react";

export const dynamic =  "force-dynamic"
export const fetchCache = "force-no-store"

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
) {
    const param = await params;
    
    try {
        const token = (await cookies()).get("token")?.value;
        const res = (
            await apiFetch(
                `
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
                            profilePicture
                        }
                    }
                }
                `,
                {
                    variables: { slug: param.slug },
                    headers: { cookie: `token=${token}` },
                }
            )
        ).request;
        
        const post = res?.BySlug;
        
        if (!post) {
            return {
                title: "Post Not Found – Blog App",
                description: "The post you're looking for does not exist or has been removed.",
                robots: { 
                    index: false, 
                    follow: false 
                },
            } satisfies Metadata; // ✅ Type check
        }
        
        // ✅ Helper: Strip HTML/Markdown
        const stripFormatting = (text: string): string => {
            return text
                .replace(/<[^>]*>/g, '')           // Remove HTML tags
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // [text](url) -> text
                .replace(/[#*_`~]/g, '')           // Remove markdown symbols
                .replace(/\s+/g, ' ')              // Normalize spaces
                .trim();
        };
        
        // ✅ Generate description dengan fallback
        const cleanContent = post.content ? stripFormatting(post.content) : '';
        const description = cleanContent.length > 0
            ? cleanContent.slice(0, 155) + (cleanContent.length > 155 ? '...' : '')
            : `Read "${post.title}" by ${post.user?.username || 'our author'} on Blog App.`;
        
        const title = `${post.title} – Blog App`;
        const url = `https://blog.manu-tech.my.id/${post.user?.username}/${post.slug}`;
        
        return {
            title,
            description, // ✅ MUST be present
            metadataBase: new URL('https://blog.manu-tech.my.id'), // ✅ Recommended
            alternates: {
                canonical: url,
            },
            openGraph: {
                title,
                description, // ✅ Same description
                type: "article",
                url,
                publishedTime: post.createdAt,
                modifiedTime: post.updateAt,
                authors: [`https://blog.manu-tech.my.id/${post.user?.username}`],
                images: [
                    {
                        url: post.user?.profilePicture || "/default-avatar.png",
                        alt: post.title,
                        width: 1200,
                        height: 630,
                    },
                ],
                siteName: "Blog App",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description, // ✅ Same description
                images: [post.user?.profilePicture || "/default-avatar.png"],
                creator: `@${post.user?.username}`,
            },
        } satisfies Metadata; // ✅ Type check
        
    } catch (e) {
        const readableTitle = param.slug?.replaceAll("-", " ") || "Post";
        
        return {
            title: `${readableTitle} – Blog App`,
            description: `Read "${readableTitle}" on Blog App. Discover insightful articles and stories.`,
        } satisfies Metadata; // ✅ Type check
    }
}

export default function PostBySlug({ children }: { children: ReactNode }) {
    return <>{children}</>;
}