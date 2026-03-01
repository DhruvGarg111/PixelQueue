import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

/**
 * Renders a single annotation entity inside the review queue with
 * approve/reject controls and metadata badges.
 */
export const ReviewAnnotationCard = ({ annotation, onReview, disabled }) => {
    const isApproved = annotation.status === "approved";
    const isRejected = annotation.status === "rejected";

    const borderClass = isApproved
        ? "border-success/30 shadow-[inset_4px_0_0_rgba(0,255,153,1)]"
        : isRejected
            ? "border-danger/30 shadow-[inset_4px_0_0_rgba(255,0,60,1)]"
            : "border-warning/30 shadow-[inset_4px_0_0_rgba(255,184,0,1)]";

    return (
        <motion.div
            key={annotation.id}
            variants={itemVariants}
            layout
            className={`group p-5 rounded-xl border bg-surface/40 backdrop-blur-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all ${borderClass}`}
        >
            <div className="flex-1 pl-2">
                <div className="flex items-center gap-3 mb-2">
                    <strong className="text-lg font-bold text-ink tracking-wide">{annotation.label}</strong>
                    <Badge
                        variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}
                        className="uppercase tracking-widest text-[9px]"
                    >
                        {annotation.status}
                    </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-gray-600">
                    <span className="flex items-center gap-1.5 bg-white/30 px-2 py-1 rounded">
                        <span className="text-gray-500">SRC:</span>
                        <span className={annotation.source === "manual" ? "text-ink" : "text-primary"}>
                            {annotation.source.toUpperCase()}
                        </span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/30 px-2 py-1 rounded">
                        <span className="text-gray-500">TYPE:</span>
                        <span className="text-ink">{annotation.geometry.type.toUpperCase()}</span>
                    </span>
                    {annotation.confidence !== null && annotation.confidence !== undefined && (
                        <span className="flex items-center gap-1.5 bg-white/30 px-2 py-1 rounded">
                            <span className="text-gray-500">CONF:</span>
                            <span className={annotation.confidence > 0.8 ? "text-success" : "text-warning"}>
                                {annotation.confidence.toFixed(2)}
                            </span>
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0 opacity-100 transition-opacity">
                <Button
                    disabled={disabled}
                    onClick={() => onReview(annotation.id, "approve")}
                    variant="outline"
                    className={`w-full sm:w-28 font-mono tracking-widest text-xs h-10 ${isApproved
                            ? "bg-success border-success text-success-foreground hover:bg-success/90"
                            : "bg-success/5 border-success/30 text-success hover:bg-success/10 hover:border-success/50"
                        }`}
                >
                    {isApproved ? "PASSED" : "PASS"}
                </Button>
                <Button
                    disabled={disabled}
                    onClick={() => onReview(annotation.id, "reject")}
                    variant="outline"
                    className={`w-full sm:w-28 font-mono tracking-widest text-xs h-10 ${isRejected
                            ? "bg-danger border-danger text-danger-foreground hover:bg-danger/90"
                            : "bg-danger/5 border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/50"
                        }`}
                >
                    {isRejected ? "REJECTED" : "REJECT"}
                </Button>
            </div>
        </motion.div>
    );
};
