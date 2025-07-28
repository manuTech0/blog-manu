"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import Cookies from "js-cookie"
import { ApiResponse, User } from "@/lib/types"
import axios from "axios"
import NewBlogs from "@/components/newBlogs"
import ThemeToggle from "@/components/toggleThemeButton"



export default function LandingPage() {
  const [myUser, setMyUser] = React.useState<User | undefined>(undefined)
  const [viewBlogs, setViewBlogs] = React.useState(false)
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
    <>
      <main className="min-h-screen bg-gradient-to-br from-white to-slate-100 flex flex-col items-center justify-center px-4">
        <motion.div
          className="text-center max-w-2xl w-screen"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Welcome to <span className="text-blue-600">BlogNest</span>
          </h1>
          <p className="text-lg text-slate-600 mb-6">
            A modern blogging platform where ideas come alive. Share your stories, explore articles, and connect with the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {myUser == undefined ? (
              <>
                <Link href="/login">
                  <Button variant="default">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary">Register</Button>
                </Link>
              </>
            ) : ""}
            <Link href="/#blogs">
              <Button onClick={() => setViewBlogs(!viewBlogs)}>Explore Blogs</Button>
            </Link>
          </div>
        </motion.div>
        <motion.footer
          className="absolute bottom-4 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          © {new Date().getFullYear()} BlogNest. Crafted with ♥
        </motion.footer>
      </main>
      {viewBlogs ? (
        <NewBlogs></NewBlogs>
      ) : ""}
    </>
  )
}
