"use client"

import * as React from "react";
import { useEffect, useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import { ApiResponse, ErrorZod, Post, User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClientZodPost } from "@/lib/allZodSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import z from "zod";
import { toast } from "sonner";
import Cookies from "js-cookie"
import { zodErrorValidateToStr } from "@/lib/utils";


export default function BlogDetailPage() {
  const [post, setPost] = useState<Post<User> | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<{
    mode?: "edit";
    slug?: string;
  } | undefined>(undefined)

  const router = useRouter()
  const token = Cookies.get("token")
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
    setMode({
      mode: searchParams.get("edit") ? "edit" : undefined,
      slug: searchParams.get("slug") || ""
    })
  }, [searchParams])
  useEffect(() => {
    if (mode) {
        (async () => {
            try {
                const res = await axios.get("/api/post/"+mode?.slug)
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
  }, [mode])


  const { createSchema } = new ClientZodPost()
  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { 
      title: "",
      content: "",
      postId: 0
    },
  })

  useEffect(() => {
    if(mode && post) {
      form.reset({
        title: post.title,
        content: post.content,
        postId: post.postId
      })
    }
  }, [post])
  useEffect(() => {
    if (myUser) {
      form.reset({
        ...form.getValues(),
        userId: myUser.userId,
      });
    }
  }, [myUser, post]);

  const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

  const saveHandle = (values: z.infer<typeof createSchema>) => {
    console.log(values)
    if(mode) {
      const dataPromise = axios.put("/api/protected/post/"+values.postId, {
        title: values.title == post?.title ? "" : values.title,
        content: values.content
      }, {
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
          router.push("/account")
          form.reset()
          return `Post has been added`;
        },
        error: (err) => (err?.data?.data as ErrorZod[]) ? zodErrorValidateToStr(err?.data?.message as ErrorZod[]) : err?.data?.message || err?.message || "Unknown error",
      });
    } else {
      const dataPromise = axios.post("/api/protected/post/0/", {
        title: values.title,
        content: values.content,
        userId: myUser?.userId
      }, {
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
          router.push("/account")
          form.reset()
          return `Post has been added`;
        },
        error: (err) => (err?.data?.data as ErrorZod[]) ? zodErrorValidateToStr(err?.data?.message as ErrorZod[]) : err?.data?.message || err?.message || "Unknown error"
      });
    }
  }

  if (loading && mode) {
    return <div className="text-center mt-20 text-muted-foreground">Memuat...</div>
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-4 sm:px-6 mt-10 lg:px-32 xl:px-64 py-10 min-h-screen bg-background text-foreground"
    >
      <Form {...form}>
        <form method="post" onSubmit={form.handleSubmit(saveHandle)} className="space-y-8">
          <FormField
            control={form.control}
            name="postId"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input placeholder="Insert title..." type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input value={post?.userId ?? 0} placeholder="Insert title..." onChange={() => field.onChange(post?.userId ?? 0)} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Insert title..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <MDEditor {...field} value={field.value} onChange={(value) => field.onChange(value)}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {JSON.stringify(form.formState.errors)}
          <Button variant="outline" className="w-full mt-4" type="submit">Save</Button>
        </form>
      </Form>
  
    </motion.div>
  )
}
