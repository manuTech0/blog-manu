"use client"
import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarMenuAction,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarMenuSub,
} from "@/components/ui/sidebar"
import { ChevronsUpDown, LogOut, Plus, ShieldUser, StickyNote, Trash, Users } from "lucide-react"
import ThemeToggle from "./toggleThemeButton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { DropdownMenuItem } from "./ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAdminState } from "./adminStateProvider"
import { MyUserResponse } from "@/lib/types"
import Cookies from "js-cookie";
import axios from "axios"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

const token = Cookies.get("token")

export function AppSidebar() {
    const { isMobile } = useSidebar()
    const router = useRouter()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {formMode, setFormMode} = useAdminState()
    const [myUser, setMyuser] = React.useState<MyUserResponse | undefined>(undefined)

    React.useEffect(() => {
        axios.get("/api/protected/user/myuser", {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "Application/type"
            }
        }).then(response => {
            if(response.status == 200) {
                const user: MyUserResponse = response.data
                setMyuser(user)
            }
        })
    }, [])

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center justify-between">
                        <div className="flex items-center">
                            <ShieldUser size={30}/>
                            <h4 className="h-full flex align-middle">Admin Dashboard</h4>
                        </div>
                        <ThemeToggle />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Data</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem key="Posts">
                                <SidebarMenuButton asChild>
                                    <a href="/admin/posts">
                                        <StickyNote size={20}/>
                                        <span>Posts</span>
                                    </a>
                                </SidebarMenuButton>
                                <SidebarMenuAction onClick={() => setFormMode({
                                    mode: "add",
                                    dataType: "post",
                                    dialog: true,
                                    data: null
                                })}>
                                    <Plus /> <span className="sr-only">Add Post</span>
                                </SidebarMenuAction>
                            </SidebarMenuItem>
                            <SidebarMenuItem key="Users">
                                <SidebarMenuButton asChild>
                                    <a href="/admin/users">
                                        <Users size={20}/>
                                        <span>Users</span>
                                    </a>
                                </SidebarMenuButton>
                                <SidebarMenuAction onClick={() => setFormMode({
                                        mode: "add",
                                        dataType: "user",
                                        dialog: true,
                                        data: null
                                    })}>
                                    <Plus /> <span className="sr-only">Add User</span>
                                </SidebarMenuAction>
                            </SidebarMenuItem>
                            <SidebarMenuItem key="Trash">
                                <SidebarMenuButton><Trash size={20}/> Trash</SidebarMenuButton>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <a href="/admin/trash/post">
                                                <StickyNote size={20}/>
                                                <span>Post</span>
                                            </a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild>
                                            <a href="/admin/trash/users">
                                                <Users size={20}/>
                                                <span>Users</span>
                                            </a>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>

                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="p-1">
                                    <div className="grid flex-1 text-left">
                                        <span className="truncate text-semibold">{ myUser?.data.username }</span>
                                        <span className="truncate text-xs">{ myUser?.data.email }</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                className={cn(
                                    "w-56 p-2 rounded-xl shadow-lg z-50", // ukuran & styling
                                    "bg-popover border border-border",     // warna dari theme shadcn
                                    "animate-in fade-in zoom-in-95"
                                    )}
                            >
                                <DropdownMenuLabel>
                                    <div className="grid flex-1 text-left leading-tight">
                                        <span className="truncate text-semibold m-0">{ myUser?.data.username }</span>
                                        <span className="truncate text-xs">{ myUser?.data.email }</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Button variant="ghost" onClick={() => router.push("/logout")}>
                                        <LogOut /> Logout
                                    </Button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
