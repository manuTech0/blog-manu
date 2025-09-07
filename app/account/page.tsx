"use client"

import * as React from "react";
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ApiResponse, User } from "@/lib/types";
import axios from "axios";
import BlogPage from "@/components/newBlogs";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function UserPage() {
  const [loading, setLoading] = React.useState(true)
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

  
  if (loading) {
    return <div className="text-center mt-20 text-gray-500">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 mt-20">
      <div className="flex flex-center justify-between">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 z-0">
            <AvatarFallback>{myUser?.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {myUser?.username ?? myUser?.username }
            </h1>
            <p className="text-muted-foreground">@{myUser?.username}</p>
            <p className="text-sm text-muted-foreground">ID: {myUser?.uniqueId}</p>
          </div>
        </div>
        <div className="flex items-center h-full flex-col">
          <Link href="/account/post"><Button variant="outline" className="rounded-full"><Plus /></Button></Link>
        </div>
      </div>

      <Separator className="mb-4" />
      {/* <AccountEdit setHandleEditAccount={setHandleEditAccount} handleEditAccount={handleEditAccount}/> */}
      {myUser && myUser.userId ? (
        <BlogPage userId={myUser?.userId} />
      ) : (
        <h1 className="text-center">Not Found</h1>
      )}
    </div>
  )
}
