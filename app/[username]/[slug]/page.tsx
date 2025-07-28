"use client"

import * as React from "react";
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { motion } from "framer-motion"
import { ApiResponse, Post, User } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function BlogDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<Post<User> | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    if (slug) {
        (async () => {
            try {
                const res = await axios.get("/api/post/"+slug)
                const data: ApiResponse = res.data
                setPost(data.data as Post<User>)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                router.push("/notfound")
            } finally {
                setLoading(false)
            }
        })()
    }
  }, [slug])

  if (loading) {
    return <div className="text-center mt-20 text-gray-500">Memuat...</div>
  }

  if (!post) {
    return <div className="text-center mt-20 text-red-500">Post tidak ditemukan</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4 sm:px-6 lg:px-32 xl:px-64 py-10 min-h-screen bg-white text-black "
    >
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">{post.title}</h1>
        <div className="text-sm text-gray-600 mb-8 flex items-center gap-2 flex-wrap">
            <span>Created by: <strong>{post.user?.username || "Anonim"}</strong></span>
            <span>•</span>
            <span>
                {
                    post.createdAt && !isNaN(new Date(post.createdAt).getTime())
                    ? format(new Date(post.createdAt), "dd MMMM yyyy, HH:mm", { locale: id })
                    : "Tanggal tidak valid"
                }
            </span>
        </div>
        <Separator className="pt-2"/>
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink className="underline" href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink className="underline" href={`/${post.user?.username}`}>{post.user?.username}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{post.slug}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <article className="pt-4 prose max-w-none prose-img:rounded-lg prose-p:leading-relaxed prose-headings:font-semibold prose-headings:scroll-mt-20 prose-a:text-blue-600 prose-a:underline-offset-4">
            {post.content}
        </article>
    </motion.div>
  )
}
