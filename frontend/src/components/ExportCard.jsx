import { motion } from "framer-motion";
import { Download, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

/**
 * Renders a single export job card with status badge,
 * timestamp, error display, and download button.
 */
export const ExportCard = ({ job }) => {
    const isCompleted = job.status === "completed";
    const isFailed = job.status === "failed";

    const borderClass = isCompleted
        ? "border-success/30 shadow-[inset_4px_0_0_rgba(0,255,153,1)]"
        : isFailed
            ? "border-danger/30 shadow-[inset_4px_0_0_rgba(255,0,60,1)]"
            : "border-warning/30 shadow-[inset_4px_0_0_rgba(255,184,0,1)]";

    return (
        <motion.div
            key={job.id}
            variants={itemVariants}
            layout
            className={`group p-6 rounded-xl border bg-surface/40 backdrop-blur-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all ${borderClass}`}
        >
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <strong className="text-xl font-mono text-ink tracking-widest uppercase">
                        {job.format} Target
                    </strong>
                    <Badge
                        variant={isCompleted ? "success" : isFailed ? "destructive" : "warning"}
                        className="uppercase tracking-widest text-[9px]"
                    >
                        {job.status}
                    </Badge>
                </div>
                <div className="font-mono text-xs text-gray-500 mt-2">
                    <span className="text-gray-600">Launched:</span> {new Date(job.created_at).toLocaleString()}
                </div>
                {job.error_text && (
                    <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs font-mono flex items-start gap-2 max-w-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="break-all">{job.error_text}</span>
                    </div>
                )}
            </div>

            <div className="w-full sm:w-auto mt-4 sm:mt-0 flex shrink-0">
                {job.download_url ? (
                    <Button asChild className="w-full sm:w-48 h-12 font-mono tracking-widest text-xs uppercase gap-2">
                        <a href={job.download_url} target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4" /> Fetch Artifact
                        </a>
                    </Button>
                ) : (
                    <div className="w-full sm:w-48 h-12 flex items-center justify-center rounded-md bg-surface border border-border/5 text-gray-500 font-mono text-xs uppercase tracking-widest gap-2">
                        <RefreshCcw className="w-4 h-4 animate-spin opacity-50" />
                        Processing...
                    </div>
                )}
            </div>
        </motion.div>
    );
};
