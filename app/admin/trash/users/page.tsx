"use client"
import * as React from "react"
import axios from "axios"
import { toast } from "sonner";
import { useAdminState } from "@/components/adminStateProvider";
import Cookies from "js-cookie"
import { logger } from "@/lib/logger";
import { UsersAdminTable } from "@/components/usersAdminTable";
import { ApiResponse, User } from "@/lib/types";


export default function Posts() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loadingData, setLoadingData] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {formMode, setFormMode} = useAdminState()

  const token = Cookies.get("token")

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get("/api/protected/user/admin/permanent/", {
          headers: {
            "Content-Type": "Application/json",
            "Authorization": "Bearer " + token
          }
        })
        const data: ApiResponse = response.data
        if (data.error || !data.data) {
          toast.error("Uh oh! Something went wrong.", {
            description: data.message
          })
        } else {
          setUsers(data.data as User[])
        }
      } catch (error) {
        logger.error(error)
        toast.error("Failed to fetch users.")
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-4 w-full">
      <h1 className="text-2xl font-bold mb-4">Manage trashed Users</h1>
      <div className="w-full">
        <UsersAdminTable data={users} triggerDialogForm={setFormMode} isLoading={loadingData} tableMode="trash"/>
      </div>
    </div>
  )
}
