"use client"

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
  SidebarGroupAction,
  useSidebar,
  SidebarMenuAction
} from "@/components/ui/sidebar"
import { ChevronsUpDown, Ghost, LogOut, Moon, Plus, ShieldUser, StickyNote, Sun, Users } from "lucide-react"
import { Button } from "./ui/button"
import ThemeToggle from "./toggleThemeButton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { DropdownMenuItem } from "./ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAdminState } from "./adminStateProvider"

export function AppSidebar() {
    const { isMobile } = useSidebar()
    const {formMode, setFormMode} = useAdminState()
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
                                        <span className="truncate text-semibold">Username</span>
                                        <span className="truncate text-xs">user@example.com</span>
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
                                        <span className="truncate text-semibold m-0">Username</span>
                                        <span className="truncate text-xs">user@example.com</span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem><LogOut /> Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}