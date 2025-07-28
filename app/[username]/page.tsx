"use client"

import * as React from "react";
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useParams, useRouter } from "next/navigation";
import { ApiResponse, Post, User } from "@/lib/types";
import axios from "axios";
import BlogPage from "@/components/newBlogs";


export default function UserPage() {
   const { username } = useParams()
  const [post, setPost] = React.useState<Post<User> | null>(null)
  const [loading, setLoading] = React.useState(true)

  const router = useRouter()

  React.useEffect(() => {
    if (username) {
        (async () => {
            try {
                const res = await axios.get("/api/post/"+username)
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
  }, [username])

  if (loading) {
    return <div className="text-center mt-20 text-gray-500">Memuat...</div>
  }

  if (!post) {
    return <div className="text-center mt-20 text-red-500">Post tidak ditemukan</div>
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="underline" href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{post.user?.username}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Separator className="my-4" />

      {/* Header User seperti GitHub/TikTok */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback>{post.user?.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">
            {post.user?.username ?? post.user?.username}
          </h1>
          <p className="text-muted-foreground">@{post.user?.username}</p>
          <p className="text-sm text-muted-foreground">ID: {post.user?.uniqueId}</p>
        </div>
      </div>

      <Separator className="mb-4" />

      {/* Feed Blog */}
      <BlogPage userId={post.userId} />
    </div>
  )
}
