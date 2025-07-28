"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
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
import { ApiResponse, ApiWithPaginating, Post, User } from "@/lib/types"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewBlogs({ userId }: { userId?: number }) {
    const [blogs, setBlogs] = useState<Post<User>[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const fetchBlogs = async (page: number) => {
        setLoading(true)
        try {
            if(!userId) {
                const res = await axios.get(`/api/post?page=${page}`)
                const data: ApiResponse<ApiWithPaginating<Post<User>[]>> = res.data
                setBlogs((data.data as ApiWithPaginating<Post<User>[]>).data as Post<User>[])
                setTotalPages((data.data as ApiWithPaginating<Post<User>[]>).totalPage)
            } else {
                const res = await axios.get(`/api/post/${userId}?page=${page}`)
                const data: ApiResponse<ApiWithPaginating<Post<User>[]>> = res.data
                setBlogs((data.data as ApiWithPaginating<Post<User>[]>).data as Post<User>[])
                setTotalPages((data.data as ApiWithPaginating<Post<User>[]>).totalPage)
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
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
        <div className="pt-10 px-4 pb-3 min-h-screen" id="blogs">
        <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl font-bold text-center mb-10"
        >
            { userId ? "List Blogs" : "News Blogs" }
        </motion.h1>

        {loading && (
            <p className="text-center text-gray-500 text-sm mb-6">
            Memuat artikel...
            </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
            {!loading &&
            blogs.map((blog, index) => (
                <motion.div
                key={blog.slug}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: index * 0.15,
                    duration: 0.5,
                    ease: "easeOut",
                }}
                className="flex justify-center"
                    >
                    <Card className={cn("w-80 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between")}>
                        <CardContent className="p-6 pb-3">
                        <CardTitle className="mb-2 text-xl"><Link href={`/${blog.user?.username}/${blog.slug}`}>{blog.title}</Link></CardTitle>
                        <p className="text-gray-600 text-sm">{createExcerptFromHtml(blog.content)}</p>
                        </CardContent>
                        <CardFooter className="p-6 pt-2 text-xs text-gray-500 flex flex-col gap-1 items-start">
                        <p>
                            Dibuat oleh:{" "}
                            <span className="font-medium"><Link href={`${blog.user?.username}`}>{blog.user?.username}</Link></span>
                        </p>
                        <p>
                            {format(new Date(blog.createdAt), "dd MMMM yyyy, HH:mm", {
                            locale: id,
                            })}
                        </p>
                        </CardFooter>
                    </Card>
                </motion.div>
            ))}
        </div>

        {/* Pagination */}
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
                    className={
                    page === totalPages ? "pointer-events-none opacity-50" : ""
                    }
                />
                </PaginationItem>
            </PaginationContent>
            </Pagination>
        </div>
        </div>
    )
    }
