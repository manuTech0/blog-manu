import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar"
import "../globals.css"
import { Toaster } from "@/components/ui/sonner";
import { AdminStateProvider } from "@/components/adminStateProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin page"
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminStateProvider>
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full">
                    <SidebarTrigger />
                    {children}
                    <Toaster />
                </main>
            </SidebarProvider>
        </AdminStateProvider>
    )
}
