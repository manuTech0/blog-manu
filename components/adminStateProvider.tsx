"use client"
import * as React from "react"
import { AdminState, TriggerDialogForm } from "@/lib/types"
import { createContext, useState, useContext } from "react"

const AdminStateContext = createContext<AdminState | undefined>(undefined)

export const AdminStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [formMode, setFormMode] = useState<TriggerDialogForm>({
        mode: "add",
        dataType: "post",
        dialog: false,
        data: null
    })
    return (
        <AdminStateContext.Provider value={{formMode, setFormMode}}>
            {children}
        </AdminStateContext.Provider>
    )
}
export const useAdminState = () => {
    const context = useContext(AdminStateContext)
    if(context === undefined) {
        throw new Error("ERROR use adminContext")
    }
    return context
}