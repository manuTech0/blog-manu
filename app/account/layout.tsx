import React, { Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar"
import "../globals.css"
import { Toaster } from "@/components/ui/sonner";
import { AdminStateProvider } from "@/components/adminStateProvider";
import type { Metadata } from "next";
import { divider } from "@uiw/react-md-editor";

export const metadata: Metadata = {
  title: "Admin page"
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <html lang="en">
                <body>
                    {children}
                </body>
            </html>
        </Suspense>
    )
}
