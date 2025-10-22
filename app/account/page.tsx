"use client"

import * as React from "react";
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import BlogPage from "@/components/newBlogs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";

export default function UserPage() {
  const {isAuth, user, loading} = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if(!loading) {
      document.title = `Home | ${user?.username}`;
  
      let desc = document.querySelector("meta[name='description']");
      if (!desc) {
        desc = document.createElement("meta");
        desc.setAttribute("name", "description");
        document.head.appendChild(desc);
      }
      desc.setAttribute("content", `${user?.username} Settings`);
  
      let ogTitle = document.querySelector("meta[property='og:title']");
      if (!ogTitle) {
        ogTitle = document.createElement("meta");
        ogTitle.setAttribute("property", "og:title");
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute("content", `home | ${user?.username}`);
  
      // Set <link rel="icon">
      if (user?.profilePicture) {
        let favicon = document.querySelector("link[rel~='icon']");
        if (!favicon) {
          favicon = document.createElement("link");
          favicon.setAttribute("rel", "icon");
          document.head.appendChild(favicon);
        }
        favicon.setAttribute("href", user?.profilePicture);
      }
    }
  }, [user])
  if (loading) {
    return <div className="text-center mt-20 text-gray-500">Loading...</div>
  }

  return (
    <>
      <div className="container mx-auto px-4 mt-20">
        <div className="flex flex-center justify-between">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16 z-0">
              <AvatarImage src={user?.profilePicture} />
              <AvatarFallback>{user?.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {user?.username ?? user?.username }
              </h1>
              <p className="text-muted-foreground">@{user?.username}</p>
              <p className="text-sm text-muted-foreground">UID: {user?.uniqueId}</p>
            </div>
          </div>
          <div className="flex items-center h-full flex-col">
            <Link href="/account/post"><Button variant="outline" className="rounded-full"><Plus /></Button></Link>
          </div>
        </div>

        <Separator className="mb-4" />
        {/* <AccountEdit setHandleEditAccount={setHandleEditAccount} handleEditAccount={handleEditAccount}/> */}
        {user && user.userId ? (
          <BlogPage userId={user?.userId} />
        ) : (
          <h1 className="text-center">Not Found</h1>
        )}
      </div>
    </>
  )
}
