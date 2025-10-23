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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useParams, useRouter } from "next/navigation";
import BlogPage from "@/components/newBlogs";
import { useAuth } from "@/lib/useAuth";
import { apiFetch } from "@/lib/apiRequest";
import { Posts, Users } from "@/lib/types";


export default function UserPage() {
   const { username } = useParams()
  const [userWithPost, setUserWithPost] = React.useState<Users | null>(null)
  const [loading, setLoading] = React.useState(true)
  const {user, loading: authLoading} = useAuth()

  const router = useRouter()

  React.useEffect(() => {
    if (username) {
        (async () => {
            try {
                const res = (await apiFetch(`
                  query PostWithUser($username: String!) {
                      ByUser(username: $username) {
                        fullname
                        profilePicture
                        uniqueId
                        userId
                        username
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
                `, {
                  variables: {
                    username: username
                  }
                })).request
                setUserWithPost(res.ByUser)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              console.log(e)
                // router.push("/notfound")
            } finally {
                setLoading(false)
            }
        })()
    }
  }, [username, user])

  if (loading || authLoading) {
    return <div className="text-center mt-20 text-gray-500">Memuat...</div>
  }

  if (!userWithPost?.posts) {
    return <div className="text-center mt-20 text-red-500">Blog not defined</div>
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
            <BreadcrumbPage>{userWithPost.username}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Separator className="my-4" />

      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={userWithPost.profilePicture!} />
          <AvatarFallback>{(userWithPost.username || "")[0].toLocaleUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">
            {userWithPost.username}
          </h1>
          <p className="text-muted-foreground">@{userWithPost.fullname}</p>
          <p className="text-sm text-muted-foreground">ID: {userWithPost.uniqueId}</p>
        </div>
      </div>

      <Separator className="mb-4" />

      <BlogPage userId={userWithPost.userId} />
    </div>
  )
}
