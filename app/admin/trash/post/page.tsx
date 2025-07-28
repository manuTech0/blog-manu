"use client"
import * as React from "react"
import { PostAdminTable } from "@/components/postAdminTable";
import axios from "axios"
import { toast } from "sonner";
import { useAdminState } from "@/components/adminStateProvider";
import Cookies from "js-cookie"
import { ApiResponse, Post, User } from "@/lib/types";
import { logger } from "@/lib/logger";


export default function Posts() {
  const [post, setPost] = React.useState<Post<User>[]>([])
  const [loadingData, setLoadingData] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {formMode, setFormMode} = useAdminState()

  const token = Cookies.get("token")

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("/api/protected/post/permanent/", {
          headers: {
            "Content-Type": "Application/json",
            "Authorization": "Bearer "+token
          }
        })
        const data: ApiResponse = response.data
        if (data.error || !data.data) {
          toast.error("Uh oh! Something went wrong.", {
            description: data.message
          })
        } else {
          setPost(data.data as Post<User>[])
        }
      } catch (error) {
        logger.error(error)
        toast.error("Failed to fetch posts.")
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Manage trashed Posts</h1>
      <div className="w-full">
        <PostAdminTable data={post} triggerDialogForm={setFormMode} isLoading={loadingData} tableMode="trash"/>
      </div>
    </div>
  )
}
