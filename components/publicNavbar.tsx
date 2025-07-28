"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import ThemeToggle from "./toggleThemeButton"
import { ApiResponse, User } from "@/lib/types"
import Cookies from "js-cookie"
import axios from "axios"

export function PublicNavbar() {
  const router = useRouter()
  const [myUser, setMyUser] = React.useState<User | undefined>(undefined)
  React.useEffect(() => {
    (async () => {
      const token = Cookies.get("token")
      const response = await axios.get("/api/protected/user/myuser", {
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        }
      })
      const data: ApiResponse<User> = response.data
      if(data && data.data as User ) {
        setMyUser(data.data as User)
      } 
    })()
  }, [])

  return (
    <header className="w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Judul */}
        <Link href="/" className="text-lg font-bold tracking-wide">
          Manu Blog
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />
            {myUser ? (
                <>
                <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="capitalize">
                            {myUser.username}
                        </Button>
                    </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push("/account")}>
                            View My Account
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/reset-password")}>
                            Reset Password
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </>
            ) : ""}
        </div>
      </div>
    </header>
  )
}
