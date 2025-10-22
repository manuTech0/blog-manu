"use client"

import * as React from "react";
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { motion } from "framer-motion"
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown"
import { useAuth } from "@/lib/useAuth";
import { apiFetch } from "@/lib/apiRequest";
import { Posts } from "@/lib/types";
import { ButtonGroup } from "@/components/ui/button-group"

export default function BlogDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<Posts | null>(null)
  const [loading, setLoading] = useState(true)
  const {isAuth, user} = useAuth()
  const router = useRouter()



  useEffect(() => {
    if (slug) {
        (async () => {
            try {
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
                    slug: slug
                  }
                })).request
                if(res.BySlug == null) {
                  throw Error()
                }
                setPost(res.BySlug)
            } catch (_) {
                router.push("/notfound")
            } finally {
                setLoading(false)
            }
        })()
    }
  }, [slug])

  if (loading) {
    return <div className="text-center mt-20 text-muted-foreground">Loading...</div>
  }

  if (!post) {
    return <div className="text-center mt-20 text-destructive">Blog not defined</div>
  }

  const deleteHandle = () => {
    const deletePost = apiFetch(`
      mutation blogs($postId: [String!]!) {
        delete(postId: $postId) {
          title
          slug
          content
        }
      }  
    `, {
      variables: {
        postId: [post.postId]
      }
    })
    toast.promise(deletePost, {
      loading: "Deleted...",
      error: (err) => {
        return "error"
      },
      success: (data) => {
        const response = data.request
        setTimeout(() => {
          router.push("/"+post.user?.username || "account")
        }, 200);
        return `"${response.delete.title || post.title}" success delete`
      }
    })
  }
  const visibilityHandle = () => {
    const deletePost = apiFetch(`
      mutation Change($postId: String!) {
        ChangeVisibility(postId: $postId) {
          status
        }
      }
    `, {
      variables: {
        postId: post.postId
      }
    })
    toast.promise(deletePost, {
      loading: "Updates...",
      error: (err) => {
        return "error"
      },
      success: (data) => {
        const response = data.request
        setTimeout(() => {
          router.refresh()
        }, 200);
        return `"${post.title}" success update`
      }
    })
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
            {post.status == "private" && (
              <>
                <span>•</span>
                <span>private blog</span>
              </>
            )}
        </div>

        <Separator className="bg-border" />

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
        {isAuth && user?.userId == post.userId && (
            <div className="flex justify-between items-center mt-6">
              <ButtonGroup className="flex-1">
                <Button onClick={() => router.replace(`/account/post?edit=edit&slug=${post.slug}`)} variant="outline">Edit</Button>
              </ButtonGroup>
              <ButtonGroup aria-label="destruction button group" className="w-full flex-1 flex justify-end">
                  <Dialog>
                      <DialogTrigger asChild>
                          <Button variant="destructive" className="border border-foreground">
                              Change to {post.status === "private" ? "public" : "private"}
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Are you absolutely sure?</DialogTitle>
                              <DialogDescription>
                                  This will change your blog to private
                              </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                              <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button type="submit" onClick={() => visibilityHandle()}>Update</Button>
                          </DialogFooter>
                      </DialogContent>
                  </Dialog>
                  <Dialog>
                      <DialogTrigger asChild>
                          <Button variant="destructive" className="border border-foreground">Delete Post</Button>
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
              </ButtonGroup>
          </div>
        )}
    </motion.div>
  )
}
