import React from "react"
import { NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import { LayoutDashboard, PenTool, CheckSquare, Download, Settings, LogOut } from "lucide-react"
import { useAuthStore } from "../store/authStore"

const SIDEBAR_ITEMS = [
    { name: "Dashboard", icon: LayoutDashboard, path: (projectId) => `/projects` },
    { name: "Annotate", icon: PenTool, path: (projectId) => `/projects/${projectId}/annotate`, requiresProject: true },
    { name: "Review", icon: CheckSquare, path: (projectId) => `/projects/${projectId}/review`, requiresProject: true },
    { name: "Exports", icon: Download, path: (projectId) => `/projects/${projectId}/exports`, requiresProject: true }
]

export function Sidebar({ projectId }) {
    const clearAuth = useAuthStore(s => s.clear)

    return (
        <motion.aside
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="w-64 border-r border-border bg-surface/80 backdrop-blur-md flex flex-col h-screen fixed left-0 top-0 z-40"
        >
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 shadow-neon-primary">
                        <span className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white">
                        Pixel<span className="text-primary">Queue</span>
                    </h1>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {SIDEBAR_ITEMS.map((item) => {
                    if (item.requiresProject && !projectId) return null;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path(projectId)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                                    <span className="font-medium">{item.name}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav-indicator"
                                            className="absolute left-0 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <button
                    onClick={clearAuth}
                    className="flex w-full items-center gap-3 px-4 py-3 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </motion.aside>
    )
}
