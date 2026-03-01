import React from "react"
import { useParams, Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"

export function AppLayout({ children }) {
    const { projectId } = useParams()

    return (
        <div className="min-h-screen flex relative">
            <Sidebar projectId={projectId} />
            <main className="flex-1 ml-64 p-8 relative z-10 overflow-y-auto">
                {children || <Outlet />}
            </main>
        </div>
    )
}
