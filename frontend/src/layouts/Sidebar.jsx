import React, { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { logout as logoutRequest } from "../api"
import { useAuthStore } from "../store/authStore"

const SIDEBAR_ITEMS = [
    { name: "Dashboard", icon: "dashboard", path: (projectId) => `/projects` },
    { name: "Annotate", icon: "crop_free", path: (projectId) => `/projects/${projectId}/annotate`, requiresProject: true },
    { name: "Review", icon: "checklist", path: (projectId) => `/projects/${projectId}/review`, requiresProject: true },
    { name: "Exports", icon: "download", path: (projectId) => `/projects/${projectId}/exports`, requiresProject: true }
]

export function Sidebar({ projectId }) {
    const clearAuth = useAuthStore((s) => s.clear)
    const me = useAuthStore((s) => s.me)
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)

    async function handleLogout() {
        setLoggingOut(true)
        try {
            await logoutRequest()
        } catch {
            // Best effort.
        } finally {
            clearAuth()
            navigate("/login", { replace: true })
            setLoggingOut(false)
        }
    }

    return (
        <aside className="w-64 flex flex-col justify-between border-r border-solid border-primary/20 p-4 shrink-0 overflow-y-auto bg-background-dark/80 custom-scrollbar">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <h1 className="text-slate-100 text-base font-medium leading-normal">
                        {projectId ? `Project ${projectId.substring(0, 8)}` : "Workspace"}
                    </h1>
                    <p className="text-primary/70 text-[10px] font-bold leading-normal font-mono uppercase tracking-widest mt-1">
                        ACTIVE_SESSION
                    </p>
                </div>
                <nav className="flex flex-col gap-2">
                    {SIDEBAR_ITEMS.map((item) => {
                        if (item.requiresProject && !projectId) return null
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path(projectId)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${isActive
                                        ? "bg-primary/20 text-primary"
                                        : "text-slate-300 hover:bg-primary/10 hover:text-primary"
                                    }`
                                }
                            >
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                <span className="leading-normal">{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="flex flex-col mt-auto pt-4 border-t border-primary/20">
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg border border-primary/10 bg-primary/5">
                    <div className="w-8 h-8 rounded bg-background-dark flex items-center justify-center text-primary font-bold text-sm uppercase">
                        {me?.email?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{me?.full_name || me?.email || "Operator"}</p>
                        <p className="text-[10px] text-primary/70 font-mono uppercase tracking-wider truncate">{me?.global_role || "guest"}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm font-medium"
                >
                    <span className={`material-symbols-outlined text-[20px] ${loggingOut ? "animate-pulse" : ""}`}>logout</span>
                    <span className="leading-normal">{loggingOut ? "Ending session..." : "Log Out"}</span>
                </button>
            </div>
        </aside>
    )
}
