import React from "react"
import { useParams, Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { motion } from "framer-motion"

export function AppLayout({ children }) {
    const { projectId } = useParams()

    return (
        <div className="min-h-screen bg-transparent flex">
            <Sidebar projectId={projectId} />
            <motion.main
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex-1 ml-64 p-8 relative overflow-y-auto"
            >
                {children || <Outlet />}
            </motion.main>
        </div>
    )
}
