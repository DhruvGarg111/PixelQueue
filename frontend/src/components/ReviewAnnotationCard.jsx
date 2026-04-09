import React from "react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

// ⚡ Bolt Optimization: Added React.memo to prevent unnecessary re-renders of list items
// in the ReviewQueue when parent state changes.
export const ReviewAnnotationCard = React.memo(({ annotation, onReview, disabled }) => {
    const isApproved = annotation.status === "approved";
    const isRejected = annotation.status === "rejected";

    const borderClass = isApproved
        ? "border-l-4 border-l-[#10B981]"
        : isRejected
            ? "border-l-4 border-l-red-500"
            : "border-l-4 border-l-[#F59E0B]";

    return (
        <div
            className={`group p-4 rounded-lg bg-background-dark/80 border border-primary/20 flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-colors duration-150 hover:border-primary/50 shadow-none backdrop-blur ${borderClass}`}
        >
            <div className="flex-1 pl-2">
                <div className="flex items-center gap-3 mb-3">
                    <strong className="text-lg font-bold text-slate-100 tracking-wide font-display">{annotation.label}</strong>
                    <Badge
                        variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}
                        className="font-bold py-1 px-2"
                    >
                        {annotation.status}
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5 bg-background-dark border border-primary/20 px-2 py-1 rounded">
                        <span className="text-primary/50 material-symbols-outlined text-[14px]">source</span>
                        <span className={annotation.source === "manual" ? "text-slate-100" : "text-primary"}>
                            {annotation.source}
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-background-dark border border-primary/20 px-2 py-1 rounded">
                        <span className="text-primary/50 material-symbols-outlined text-[14px]">category</span>
                        <span className="text-slate-100">{annotation.geometry.type}</span>
                    </span>
                    {annotation.confidence !== null && annotation.confidence !== undefined && (
                        <span className="flex items-center gap-1.5 bg-background-dark border border-primary/20 px-2 py-1 rounded">
                            <span className="text-primary/50 material-symbols-outlined text-[14px]">analytics</span>
                            <span className={annotation.confidence > 0.8 ? "text-[#10B981]" : "text-[#F59E0B]"}>
                                {(annotation.confidence * 100).toFixed(0)}%
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
                    className={`w-full sm:w-24 font-mono tracking-widest text-[10px] h-10 transition-colors duration-150 font-bold flex items-center gap-2 ${isApproved
                        ? "bg-[#10B981] border-[#10B981] text-background-dark hover:bg-[rgba(16,185,129,0.9)] opacity-100"
                        : "bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.2)] text-[#10B981] hover:bg-[rgba(16,185,129,0.1)] hover:border-[#10B981]"
                        }`}
                >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span> {isApproved ? "PASSED" : "PASS"}
                </Button>
                <Button
                    disabled={disabled}
                    onClick={() => onReview(annotation.id, "reject")}
                    variant="outline"
                    className={`w-full sm:w-24 font-mono tracking-widest text-[10px] h-10 transition-colors duration-150 font-bold flex items-center gap-2 ${isRejected
                        ? "bg-red-500 border-red-500 text-slate-100 hover:bg-red-500/90 opacity-100"
                        : "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                        }`}
                >
                    <span className="material-symbols-outlined text-[16px]">cancel</span> {isRejected ? "REJECTED" : "REJECT"}
                </Button>
            </div>
        </div>
    );
});
