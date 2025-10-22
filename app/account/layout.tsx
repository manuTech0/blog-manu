import React, { Suspense } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            {children}
        </Suspense>
    )
}
