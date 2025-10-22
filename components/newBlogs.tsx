"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardFooter,
    CardTitle,
} from "@/components/ui/card"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn, createExcerptFromHtml } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/apiRequest"
import { Users } from "@/lib/types"

interface Blogs {
    postId: string
    title: string
    content: string
    slug: string
    status: string
    userId: string
    createdAt: Date
    updateAt: Date
    user: {
        fullname: string
        username: string
    }
}

export default function NewBlogs({ userId }: { userId?: string }) {
    const [blogs, setBlogs] = useState<Blogs[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const pageSize = 8

    const fetchBlogs = async (page: number) => {
        setLoading(true)

        try {
            if (!userId) {
                // Public posts
                const skip = (page - 1) * pageSize

                const result = (await apiFetch(
                    `
                    query GetPublicPosts($skip: Int!, $take: Int!) {
                        GetAll(skip: $skip, take: $take) {
                            content
                            createdAt
                            postId
                            slug
                            status
                            title
                            updateAt
                            userId
                            user {
                                fullname
                            }
                        }
                        postsCount
                    }
                    `,
                    {
                        variables: { skip, take: pageSize }
                    }
                )).request
                console.log(result)
                const blogList = result?.GetAll ?? []
                const postCount = result?.postsCount ?? 0

                setBlogs(blogList)
                setTotalPages(Math.ceil(postCount / pageSize))

            } else {
                // User-specific posts
                const result = (await apiFetch(
                    `
                    query GetUserPosts($userId: String!) {
                        ByUser(userId: $userId) {
                            fullname
                            username
                            posts {
                                postId
                                title
                                content
                                slug
                                status
                                userId
                                createdAt
                                updateAt
                            }
                        }
                        postsCountByUser(userId: $userId)
                    }
                    `,
                    {
                        variables: { userId: String(userId) }
                    }
                )).request
                const blogList = result?.ByUser?.posts ?? []
                const postCount = result?.postsCountByUser ?? 0

                // Inject user fullname into each post
                const withUser = blogList.map((post: any) => ({
                    ...post,
                    user: { fullname: result?.ByUser?.fullname || "Unknown" }
                }))

                // Pagination handled manually since posts come in full
                const paginated = withUser.slice((page - 1) * pageSize, page * pageSize)

                setBlogs(paginated)
                setTotalPages(Math.ceil(postCount / pageSize))
            }
        } catch (err) {
            router.push("/notfound")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBlogs(page)
    }, [page])

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage)
        }
    }

    return (
        <div className="pt-20 px-4 pb-3 min-h-screen" id="blogs">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-3xl font-bold text-center mb-10"
            >
                {userId ? "Blog List" : "Latest Blogs"}
            </motion.h1>

            {loading ? (
                <p className="text-center text-gray-500 text-sm mb-6">
                    Loading articles...
                </p>
            ) : blogs.length === 0 ? (
                <p className="text-center text-gray-500 text-sm mb-6">
                    No articles available yet.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
                        {blogs.map((blog, index) => (
                            <motion.div
                                key={blog.slug}
                                initial={{ opacity: 0, y: -50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.15,
                                    duration: 0.5,
                                    ease: "easeOut"
                                }}
                                className="flex justify-center"
                            >
                                <Card className={cn("w-80 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between")}>
                                    <CardContent className="p-6 pb-3">
                                        <CardTitle className="mb-2 text-xl">
                                            <Link href={`/${blog.user?.fullname}/${blog.slug}`}>
                                                {blog.title}
                                            </Link>
                                        </CardTitle>
                                        <p className="text-gray-600 text-sm">
                                            {createExcerptFromHtml(blog.content)}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-6 pt-2 text-xs text-gray-500 flex flex-col gap-1 items-start">
                                        <p>
                                            Written by:{" "}
                                            <span className="font-medium">
                                                <Link href={`/${blog.user?.fullname}`}>
                                                    {blog.user?.fullname}
                                                </Link>
                                            </span>
                                        </p>
                                        <p>
                                            {format(new Date(blog.createdAt), "dd MMMM yyyy, HH:mm", {
                                                locale: id
                                            })}
                                        </p>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handlePageChange(page - 1)
                                        }}
                                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const pageIndex = i + 1
                                    return (
                                        <PaginationItem key={pageIndex}>
                                            <PaginationLink
                                                href="#"
                                                isActive={pageIndex === page}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    handlePageChange(pageIndex)
                                                }}
                                            >
                                                {pageIndex}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handlePageChange(page + 1)
                                        }}
                                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </>
            )}
        </div>
    )
}
