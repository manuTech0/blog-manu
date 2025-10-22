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
import { usePathname, useRouter } from "next/navigation"
import ThemeToggle from "./toggleThemeButton"
import { ArrowDown } from "lucide-react"
import { useAuth } from "../lib/useAuth"

export function PublicNavbar() {
  const router = useRouter()
  const {isAuth, user} = useAuth()
  const pathname = usePathname()


  return (
    <header className="w-full shadow-lg bg-background fixed t-0" style={{ "top": 0 }}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Judul */}
        <Link href="/" className="text-lg font-bold tracking-wide">
          Manu Blog
        </Link>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />
            {isAuth && user ? (
                <>
                <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="capitalize">
                            {user.username} <ArrowDown />
                        </Button>
                    </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push("/account")}>
                            My Account
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/logout")}>
                            Logout
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
