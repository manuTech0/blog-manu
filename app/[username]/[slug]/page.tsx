"use client"

import * as React from "react";
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { motion } from "framer-motion"
import { ApiResponse, ErrorZod, Post, User } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Cookies from "js-cookie"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { zodErrorValidateToStr } from "@/lib/utils";
import ReactMarkdown from "react-markdown"


export default function BlogDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<Post<User> | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()

const [myUser, setMyUser] = React.useState<User | undefined>(undefined)
  React.useEffect(() => {
    (async () => {
      setLoading(true)
      const token = Cookies.get("token")
      const response = await axios.get("/api/protected/user/myuser", {
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        }
      })
      const data: ApiResponse<User> = response.data
      if(data && data.data as User ) {
        setLoading(false)
        setMyUser(data.data as User)
      } 
    })()
  }, [])

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
    return <div className="text-center mt-20 text-muted-foreground">Memuat...</div>
  }

  if (!post) {
    return <div className="text-center mt-20 text-destructive">Post tidak ditemukan</div>
  }

    const deleteHandle = () => {
        const token = Cookies.get("token")
        const dataPromise = axios.delete("/api/protected/post/"+post.postId, {
        headers: {
          "Content-Type": "Application/json",
          "Authorization": `Bearer ${token}` 
        },
      })
      toast.promise(dataPromise, {
        loading: 'Loading...',
        success: (response) => {
          const data: ApiResponse = response.data
          if(data.error || !data.data) {
            if(data.data as ErrorZod[]) return zodErrorValidateToStr(data.data as ErrorZod[])
            return "Uh oh! Something went wrong: " + JSON.stringify(data.data)
          }
          return `Post has been deleted`;
        },
        error: (err) => (err?.data?.data as ErrorZod[]) ? zodErrorValidateToStr(err?.data?.message as ErrorZod[]) : err?.data?.message || err?.message || "Unknown error"
      });
    }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4 sm:px-6 mt-10 lg:px-32 xl:px-64 py-10 min-h-screen bg-background text-foreground"
    >
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">{post.title}</h1>
        <div className="text-sm text-muted-foreground mb-8 flex items-center gap-2 flex-wrap">
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

        {/* Separator adaptif */}
        <Separator className="bg-border" />

        {/* Breadcrumb adaptif */}
        <Breadcrumb className="my-2">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink className="underline hover:text-primary" href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink className="underline hover:text-primary" href={`/${post.user?.username}`}>{post.user?.username}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage><span className="truncate max-w-xs">{post.slug}</span></BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <Separator className="bg-border" />



        <article className="pt-4 prose dark:prose-invert max-w-none prose-img:rounded-lg prose-p:leading-relaxed prose-headings:font-semibold prose-headings:scroll-mt-20 prose-a:text-primary prose-a:underline-offset-4">
            <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>
        <Separator className="bg-border mt-4" /> 
        {myUser?.username == post.user?.username && (
            <>
                <Link href={`/account/post?=edit=edit&slug=${post.slug}`}><Button variant="outline" className="w-full mt-4">Edit</Button></Link>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" className="w-full">Delete Post</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will permanently delete your post.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" onClick={() => deleteHandle()}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )}
    </motion.div>
  )
}
