import { Download, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export const ExportCard = ({ job }) => {
    const isCompleted = job.status === "completed";
    const isFailed = job.status === "failed";

    const borderClass = isCompleted
        ? "border-l-[2px] border-l-[#10B981]"
        : isFailed
            ? "border-l-[2px] border-l-[#EF4444]"
            : "border-l-[2px] border-l-[#F59E0B]";

    return (
        <div
            className={`group p-5 rounded-[8px] bg-[#111827] border border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-colors duration-150 shadow-none hover:border-[rgba(59,130,246,0.3)] ${borderClass}`}
        >
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <strong className="text-sm font-mono text-ink tracking-widest uppercase">
                        {job.format} Target
                    </strong>
                    <Badge
                        variant={isCompleted ? "success" : isFailed ? "destructive" : "warning"}
                    >
                        {job.status}
                    </Badge>
                </div>
                <div className="font-mono text-[10px] text-ink-muted mt-2 uppercase tracking-wider">
                    <span className="text-ink-faint">Launched:</span> {new Date(job.created_at).toLocaleString()}
                </div>
                {job.error_text && (
                    <div className="mt-3 p-3 bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-[8px] text-danger font-mono text-[10px] flex items-start gap-2 max-w-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">{job.error_text}</span>
                    </div>
                )}
            </div>

            <div className="w-full sm:w-auto mt-4 sm:mt-0 flex shrink-0">
                {job.download_url ? (
                    <Button asChild className="w-full sm:w-48 h-9 font-mono tracking-widest text-[10px] uppercase gap-2 bg-[#2563EB] text-white hover:bg-[#3B82F6] border-transparent transition-colors duration-150">
                        <a href={job.download_url} target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4" /> Fetch Artifact
                        </a>
                    </Button>
                ) : (
                    <div className="w-full sm:w-48 h-9 flex items-center justify-center rounded-[8px] bg-[#020617] border border-[rgba(255,255,255,0.06)] text-ink-muted font-mono text-[10px] uppercase tracking-widest gap-2">
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin opacity-50" />
                        Processing...
                    </div>
                )}
            </div>
        </div>
    );
};
