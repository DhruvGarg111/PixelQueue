import React from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

// ⚡ Bolt Optimization: Added React.memo to prevent unnecessary re-renders of list items
// in the Exports pipeline stream when parent state changes.
export const ExportCard = React.memo(({ job }) => {
    const isCompleted = job.status === "completed";
    const isFailed = job.status === "failed";

    const borderClass = isCompleted
        ? "border-l-4 border-l-[#10B981]"
        : isFailed
            ? "border-l-4 border-l-red-500"
            : "border-l-4 border-l-[#F59E0B]";

    return (
        <div
            className={`group p-5 rounded-lg bg-background-dark/80 border border-primary/20 flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-colors duration-150 shadow-none hover:border-primary/50 ${borderClass}`}
        >
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <strong className="text-sm font-mono text-slate-100 tracking-widest uppercase font-bold">
                        {job.format} Target
                    </strong>
                    <Badge
                        variant={isCompleted ? "success" : isFailed ? "destructive" : "warning"}
                        className="font-bold py-1 px-2"
                    >
                        {job.status}
                    </Badge>
                </div>
                <div className="font-mono text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
                    <span className="text-primary/50">Launched:</span> {new Date(job.created_at).toLocaleString()}
                </div>
                {job.error_text && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 font-mono text-[10px] flex items-start gap-2 max-w-xl font-bold">
                        <span className="material-symbols-outlined text-[16px] flex-shrink-0">error</span>
                        <span className="break-all">{job.error_text}</span>
                    </div>
                )}
            </div>

            <div className="w-full sm:w-auto mt-4 sm:mt-0 flex shrink-0">
                {job.download_url ? (
                    <Button asChild className="w-full sm:w-48 h-10 font-mono tracking-widest text-[10px] uppercase gap-2 bg-primary text-background-dark hover:bg-primary/80 border-transparent transition-colors duration-150 font-bold">
                        <a href={job.download_url} target="_blank" rel="noreferrer" className="flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">download</span> Fetch Artifact
                        </a>
                    </Button>
                ) : (
                    <div className="w-full sm:w-48 h-10 flex items-center justify-center rounded bg-background-dark border border-primary/20 text-slate-400 font-mono text-[10px] uppercase tracking-widest gap-2 font-bold">
                        <span className="material-symbols-outlined text-[16px] animate-spin opacity-50">sync</span>
                        Processing...
                    </div>
                )}
            </div>
        </div>
    );
});
