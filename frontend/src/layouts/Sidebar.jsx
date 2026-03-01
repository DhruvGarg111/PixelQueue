import React from "react"
import { NavLink, Link } from "react-router-dom"
import { LayoutDashboard, PenTool, CheckSquare, Download, LogOut, FolderKanban } from "lucide-react"
import { useAuthStore } from "../store/authStore"

const SIDEBAR_ITEMS = [
    { name: "Dashboard", icon: LayoutDashboard, path: (projectId) => `/projects` },
    { name: "Annotate", icon: PenTool, path: (projectId) => `/projects/${projectId}/annotate`, requiresProject: true },
    { name: "Review", icon: CheckSquare, path: (projectId) => `/projects/${projectId}/review`, requiresProject: true },
    { name: "Exports", icon: Download, path: (projectId) => `/projects/${projectId}/exports`, requiresProject: true }
]

export function Sidebar({ projectId }) {
    const clearAuth = useAuthStore(s => s.clear)
    const me = useAuthStore(s => s.me)

    return (
        <aside className="w-64 border-r border-[rgba(255,255,255,0.06)] bg-[#020617] flex flex-col h-screen fixed left-0 top-0 z-40">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
                <Link to="/projects" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#3B82F6] flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-ink font-display">
                        PixelQueue
                    </h1>
                </Link>
            </div>

            <div className="p-4 py-5 text-[11px] font-semibold text-ink-faint uppercase tracking-wider font-mono">
                Menu
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {SIDEBAR_ITEMS.map((item) => {
                    if (item.requiresProject && !projectId) return null;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path(projectId)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-r-[8px] transition-colors duration-150 font-medium text-sm border-l-2 ${isActive
                                    ? "text-[#3B82F6] bg-[rgba(59,130,246,0.12)] border-[#3B82F6]"
                                    : "text-ink-muted border-transparent hover:text-ink hover:bg-[rgba(255,255,255,0.04)]"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-4 h-4 ${isActive ? 'text-[#3B82F6]' : 'text-ink-faint'}`} />
                                    {item.name}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[rgba(255,255,255,0.06)] mt-auto">
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#111827]">
                    <div className="w-8 h-8 rounded-[8px] bg-[#1F2937] flex items-center justify-center text-ink font-medium text-sm uppercase">
                        {me?.email?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{me?.email || "Operator"}</p>
                        <p className="text-xs text-ink-faint font-mono capitalize truncate">{me?.role || "Developer"}</p>
                    </div>
                </div>

                <button
                    onClick={clearAuth}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-r-[8px] text-ink-muted hover:text-danger hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150 text-sm font-medium border-l-2 border-transparent"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
