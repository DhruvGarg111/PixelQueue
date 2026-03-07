import React from "react"

export function WorkersPanel() {
    return (
        <aside className="w-80 flex flex-col border-l border-solid border-primary/20 shrink-0 overflow-hidden bg-background-dark/50">
            <div className="p-4 border-b border-primary/20 shrink-0">
                <h3 className="text-slate-100 font-bold text-sm tracking-wide">ACTIVE NODES</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {/* Worker Node */}
                <div className="flex flex-col gap-2 p-3 rounded bg-primary/5 border border-primary/10">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-200 text-sm font-mono truncate">WorkerX - auto-label.py</span>
                        <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400 text-xs font-mono">Q: 42 tasks</span>
                        <span className="text-primary text-xs font-mono">85% CPU</span>
                    </div>
                </div>
                {/* Worker Node */}
                <div className="flex flex-col gap-2 p-3 rounded bg-primary/5 border border-primary/10">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-200 text-sm font-mono truncate">WorkerY - export.py</span>
                        <span className="material-symbols-outlined text-purple-400 text-[16px]">sync</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400 text-xs font-mono">Q: 12 tasks</span>
                        <span className="text-purple-400 text-xs font-mono">45% CPU</span>
                    </div>
                </div>
                {/* Worker Node */}
                <div className="flex flex-col gap-2 p-3 rounded bg-primary/5 border border-primary/10 opacity-60">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-200 text-sm font-mono truncate">WorkerZ - ingest.py</span>
                        <span className="material-symbols-outlined text-slate-500 text-[16px]">pause_circle</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                        <div className="bg-slate-500 h-1.5 rounded-full" style={{ width: "0%" }}></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-500 text-xs font-mono">Q: 0 tasks</span>
                        <span className="text-slate-500 text-xs font-mono">IDLE</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
