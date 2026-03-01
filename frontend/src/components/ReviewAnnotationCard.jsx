import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export const ReviewAnnotationCard = ({ annotation, onReview, disabled }) => {
    const isApproved = annotation.status === "approved";
    const isRejected = annotation.status === "rejected";

    const borderClass = isApproved
        ? "border-l-[2px] border-l-[#10B981]"
        : isRejected
            ? "border-l-[2px] border-l-[#EF4444]"
            : "border-l-[2px] border-l-[#F59E0B]";

    return (
        <div
            className={`group p-4 rounded-[8px] bg-[#111827] border border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-colors duration-150 hover:border-[rgba(59,130,246,0.3)] ${borderClass}`}
        >
            <div className="flex-1 pl-2">
                <div className="flex items-center gap-3 mb-3">
                    <strong className="text-sm font-bold text-ink tracking-wide font-display">{annotation.label}</strong>
                    <Badge
                        variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}
                    >
                        {annotation.status}
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    <span className="flex items-center gap-1.5 bg-[#020617] border border-[rgba(255,255,255,0.04)] px-2 py-1 rounded-[6px]">
                        <span className="text-ink-faint">SRC:</span>
                        <span className={annotation.source === "manual" ? "text-ink" : "text-[#3B82F6]"}>
                            {annotation.source}
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-[#020617] border border-[rgba(255,255,255,0.04)] px-2 py-1 rounded-[6px]">
                        <span className="text-ink-faint">TYPE:</span>
                        <span className="text-ink">{annotation.geometry.type}</span>
                    </span>
                    {annotation.confidence !== null && annotation.confidence !== undefined && (
                        <span className="flex items-center gap-1.5 bg-[#020617] border border-[rgba(255,255,255,0.04)] px-2 py-1 rounded-[6px]">
                            <span className="text-ink-faint">CONF:</span>
                            <span className={annotation.confidence > 0.8 ? "text-[#10B981]" : "text-[#F59E0B]"}>
                                {annotation.confidence.toFixed(2)}
                            </span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 opacity-100 transition-opacity">
                <Button
                    disabled={disabled}
                    onClick={() => onReview(annotation.id, "approve")}
                    variant="outline"
                    className={`w-full sm:w-24 font-mono tracking-widest text-[9px] h-9 transition-colors duration-150 ${isApproved
                        ? "bg-[#10B981] border-[#10B981] text-white hover:bg-[rgba(16,185,129,0.9)] opacity-100"
                        : "bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.2)] text-[#10B981] hover:bg-[rgba(16,185,129,0.1)] hover:border-[#10B981]"
                        }`}
                >
                    {isApproved ? "PASSED" : "PASS"}
                </Button>
                <Button
                    disabled={disabled}
                    onClick={() => onReview(annotation.id, "reject")}
                    variant="outline"
                    className={`w-full sm:w-24 font-mono tracking-widest text-[9px] h-9 transition-colors duration-150 ${isRejected
                        ? "bg-[#EF4444] border-[#EF4444] text-white hover:bg-[rgba(239,68,68,0.9)] opacity-100"
                        : "bg-[rgba(239,68,68,0.05)] border-[rgba(239,68,68,0.2)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] hover:border-[#EF4444]"
                        }`}
                >
                    {isRejected ? "REJECTED" : "REJECT"}
                </Button>
            </div>
        </div>
    );
};
