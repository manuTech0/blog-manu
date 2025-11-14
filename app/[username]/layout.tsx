import { apiFetch } from "@/lib/apiRequest";
import { cookies } from "next/headers";
import React, { ReactNode } from "react";

export const dynamic =  "force-dynamic"
export const fetchCache = "force-no-store"


export async function generateMetadata(
    { params }: { params: Promise<{ username: string }> }
) {
    const param = await params;

    try {
        const token = (await cookies()).get("token")?.value;

        const res = (
            await apiFetch(
                `
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
                `,
                {
                    variables: { username: param.username },
                    headers: { cookie: `token=${token}` },
                }
            )
        ).request;

        // Fallback jika data tidak ditemukan
        if (!res?.ByUser) {
            return {
                title: "User Not Found – Blog App",
                description: "The user you are looking for does not exist.",
                robots: { index: false, follow: false },
            };
        }

        const user = res.ByUser;
        const latestPost = user.posts?.[0];

        const title =
            latestPost?.title ||
            `Posts by ${user.fullname || user.username} – Blog App`;
        const description =
            latestPost?.content?.slice(0, 160) ||
            `Read posts and updates from ${user.fullname || user.username}.`;

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: "profile",
                url: `https://blog.manu-tech.my.id/${user.username}`,
                images: [
                    {
                        url: user.profilePicture || "/default-avatar.png",
                        alt: `${user.fullname || user.username}'s profile picture`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [user.profilePicture || "/default-avatar.png"],
            },
        };
    } catch (e) {
        const username = (await param.username) || "User";
        const readableName = username.replaceAll("-", " ");

        return {
            title: `${readableName} – Blog App`,
            description: `Explore posts by ${readableName} on Blog App.`,
        };
    }
}

export default function PostByUser({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
