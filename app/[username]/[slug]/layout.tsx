import { apiFetch } from "@/lib/apiRequest";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { ReactNode } from "react";

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
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
                description: "The post you’re looking for does not exist or has been removed.",
                robots: { index: false, follow: false },
            };
        }

        const title = `${post.title} – Blog App`;
        const description = post.content?.slice(0, 160) || "Read this article on Blog App.";
        const url = `https://blog.manu-tech.my.id/${post.user?.username}/${post.slug}`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: "article",
                url,
                publishedTime: post.createdAt,
                modifiedTime: post.updateAt,
                authors: [`https://blog.manu-tech.my.id/${post.user?.username}`],
                images: [
                    {
                        url: post.user?.profilePicture || "/default-avatar.png",
                        alt: post.title,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [
                    post.user?.profilePicture || "/default-avatar.png",
                ],
            },
        };
    } catch (e) {
        const readableTitle = param.slug?.replaceAll("-", " ") || "Post";
        return {
            title: `${readableTitle} – Blog App`,
            description: `Read ${readableTitle} on Blog App.`,
        };
    }
}

export default function PostBySlug({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
