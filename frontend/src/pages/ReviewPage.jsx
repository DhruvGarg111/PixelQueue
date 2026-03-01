import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, CheckCircle2, XCircle, PlayCircle, History, ListChecks, ArrowLeft } from "lucide-react";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { ReviewAnnotationCard } from "../components/ReviewAnnotationCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export function ReviewPage() {
    const { projectId = "" } = useParams();
    const {
        tasks, selectedTaskId, setSelectedTaskId,
        bundle, status, bulkProcessing,
        approvedCount, rejectedCount, pendingCount,
        review, approveAll, rejectAll,
    } = useReviewQueue(projectId);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/50">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Link to="/projects" className="text-gray-600 hover:text-ink transition-colors mr-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <ListChecks className="w-5 h-5" />
                        <span className="text-xs font-mono uppercase tracking-widest font-semibold">Quality Control</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-2">Review Queue</h1>
                    <div className="flex items-center gap-3">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-sm font-mono text-gray-600">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column: Tasks */}
                <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
                    <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/40 border-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <h2 className="text-xs uppercase tracking-widest text-primary font-mono font-semibold mb-4 flex items-center gap-2">
                            <History className="w-4 h-4" /> Active Block
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-lg bg-white/40 border border-border/5 flex flex-col items-center justify-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <strong className="text-3xl font-mono text-ink relative z-10">{tasks.length}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 relative z-10 text-center">Tasks Pending</span>
                            </div>
                            <div className="p-4 rounded-lg bg-white/40 border border-border/5 flex flex-col items-center justify-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-success/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <strong className="text-3xl font-mono text-ink relative z-10">{approvedCount + rejectedCount}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 relative z-10 text-center">Processed</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-0 border-t-2 border-t-primary/30 flex flex-col max-h-[600px]">
                        <div className="p-5 border-b border-border/5">
                            <h2 className="text-lg font-semibold text-ink mb-1">Task Stream</h2>
                            <p className="text-xs text-gray-600">Queue representing chunks ready for QC.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            <AnimatePresence>
                                {tasks.map((task) => (
                                    <motion.button
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => setSelectedTaskId(task.id)}
                                        className={`w-full text-left p-4 rounded-xl flex justify-between items-center transition-all duration-200 border ${selectedTaskId === task.id
                                                ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                                                : "bg-surface/50 border-border/5 hover:border-border/20 hover:bg-surface"
                                            }`}
                                    >
                                        <div>
                                            <strong className={`font-mono text-sm ${selectedTaskId === task.id ? "text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" : "text-gray-800"}`}>
                                                {task.id.slice(0, 8)}
                                            </strong>
                                            <div className="font-mono text-xs text-gray-500 mt-1">
                                                img: <span className="text-gray-600">{task.image_id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${selectedTaskId === task.id ? "border-primary/50 text-primary" : "border-border/10 text-gray-500"}`}>
                                            {task.status.replace("_", " ")}
                                        </Badge>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                            {tasks.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-gray-500 text-sm font-mono border border-dashed border-border/10 rounded-xl m-2">
                                    [ Stream is empty ]
                                </motion.div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Annotation Entities */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50 mb-6">
                        <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-primary" /> Annotation Entities
                        </h2>
                        {bundle && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={rejectAll}
                                    disabled={bundle.annotations.filter((a) => a.status !== "rejected").length === 0 || bulkProcessing}
                                    className="border-danger/50 text-danger hover:bg-danger/10 bg-danger/5 font-mono text-xs tracking-widest uppercase gap-2"
                                >
                                    <XCircle className="w-4 h-4" /> Reject All
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={approveAll}
                                    disabled={pendingCount === 0 || bulkProcessing}
                                    className="border-success/50 text-success hover:bg-success/10 bg-success/5 font-mono text-xs tracking-widest uppercase gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {bulkProcessing ? "Processing..." : "Approve All Visible"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {!bundle && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-10 border-2 border-dashed border-border/5 rounded-xl bg-surface/20">
                            <PlayCircle className="w-16 h-16 text-gray-800 mb-6" />
                            <h3 className="text-xl font-medium text-ink mb-2">Awaiting Selection</h3>
                            <p className="text-gray-500 text-center max-w-sm">Select a task from the stream to begin quality control review.</p>
                        </motion.div>
                    )}

                    {bundle && (
                        <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-4 w-full">
                            <AnimatePresence>
                                {bundle.annotations.map((ann) => (
                                    <ReviewAnnotationCard
                                        key={ann.id}
                                        annotation={ann}
                                        onReview={review}
                                        disabled={bulkProcessing}
                                    />
                                ))}
                            </AnimatePresence>
                            {bundle.annotations.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center text-gray-500 text-sm font-mono border border-dashed border-border/10 rounded-xl bg-surface/10">
                                    [ No annotations found for this entity block ]
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
