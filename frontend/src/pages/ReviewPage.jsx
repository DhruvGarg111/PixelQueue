import { Link, useParams } from "react-router-dom";
import { CheckSquare, CheckCircle2, XCircle, PlayCircle, History, ListChecks, ArrowLeft } from "lucide-react";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { ReviewAnnotationCard } from "../components/ReviewAnnotationCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

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
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Link to="/projects" className="text-ink-faint hover:text-ink transition-colors duration-150 mr-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <ListChecks className="w-5 h-5" />
                        <span className="text-[11px] font-mono uppercase tracking-widest font-semibold">Quality Control</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-ink mb-1 font-display">Review Queue</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs font-mono text-ink-muted">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column: Tasks */}
                <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
                    <Card className="p-4 shadow-none border border-[rgba(255,255,255,0.06)] bg-[#111827]">
                        <h2 className="text-[11px] uppercase tracking-widest text-[#3B82F6] font-mono font-semibold mb-4 flex items-center gap-2">
                            <History className="w-4 h-4" /> Active Block
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-[#020617] border border-[rgba(255,255,255,0.06)] flex flex-col items-center justify-center rounded-[8px]">
                                <strong className="text-2xl font-mono text-ink leading-none">{tasks.length}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-ink-faint font-mono mt-1">Pending</span>
                            </div>
                            <div className="p-3 bg-[#020617] border border-[rgba(255,255,255,0.06)] flex flex-col items-center justify-center rounded-[8px]">
                                <strong className="text-2xl font-mono text-ink leading-none">{approvedCount + rejectedCount}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-ink-faint font-mono mt-1">Processed</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-0 border border-[rgba(255,255,255,0.06)] bg-[#111827] flex flex-col max-h-[600px] shadow-none">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
                            <h2 className="text-sm font-semibold text-ink-faint uppercase font-mono tracking-wider mb-1">Task Stream</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-[#020617] rounded-b-[8px]">
                            {tasks.map((task) => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTaskId(task.id)}
                                    className={`w-full text-left p-3 rounded-[8px] flex justify-between items-center transition-colors duration-150 border ${selectedTaskId === task.id
                                        ? "bg-[#111827] border-[#3B82F6]"
                                        : "bg-[#111827] border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.15)]"
                                        }`}
                                >
                                    <div>
                                        <strong className={`font-mono text-sm ${selectedTaskId === task.id ? "text-ink" : "text-ink-muted"}`}>
                                            {task.id.slice(0, 8)}
                                        </strong>
                                        <div className="font-mono text-[10px] text-ink-faint mt-1 uppercase">
                                            img: {task.image_id.slice(0, 8)}
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className={`text-[9px] uppercase tracking-wider py-0.5 px-1.5 h-auto rounded ${selectedTaskId === task.id ? "text-primary" : "text-ink-faint"}`}>
                                        {task.status.replace("_", " ")}
                                    </Badge>
                                </button>
                            ))}
                            {tasks.length === 0 && (
                                <div className="py-12 text-center text-ink-faint text-[11px] font-mono border border-dashed border-[rgba(255,255,255,0.06)] rounded-[8px] m-2">
                                    [ Stream is empty ]
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Annotation Entities */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-[rgba(255,255,255,0.06)] mb-6">
                        <h2 className="text-lg font-semibold text-ink flex items-center gap-2 font-display">
                            <CheckSquare className="w-5 h-5 text-primary" /> Annotation Entities
                        </h2>
                        {bundle && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={rejectAll}
                                    disabled={bundle.annotations.filter((a) => a.status !== "rejected").length === 0 || bulkProcessing}
                                    className="border-[rgba(239,68,68,0.2)] text-danger hover:bg-[rgba(239,68,68,0.1)] hover:border-[#EF4444] font-mono text-[10px] tracking-widest uppercase gap-2"
                                >
                                    <XCircle className="w-4 h-4 cursor-pointer" /> Reject All
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={approveAll}
                                    disabled={pendingCount === 0 || bulkProcessing}
                                    className="border-[rgba(16,185,129,0.2)] text-success hover:bg-[rgba(16,185,129,0.1)] hover:border-[#10B981] font-mono text-[10px] tracking-widest uppercase gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4 cursor-pointer" />
                                    {bulkProcessing ? "Processing..." : "Approve All Visible"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {!bundle && (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 border border-dashed border-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#111827]">
                            <PlayCircle className="w-12 h-12 text-ink-faint mb-4" />
                            <h3 className="text-base font-medium text-ink mb-1">Awaiting Selection</h3>
                            <p className="text-ink-muted text-center max-w-sm text-sm">Select a task from the stream to begin quality control review.</p>
                        </div>
                    )}

                    {bundle && (
                        <div className="grid gap-4 w-full">
                            {bundle.annotations.map((ann) => (
                                <ReviewAnnotationCard
                                    key={ann.id}
                                    annotation={ann}
                                    onReview={review}
                                    disabled={bulkProcessing}
                                />
                            ))}
                            {bundle.annotations.length === 0 && (
                                <div className="py-16 text-center text-ink-faint text-[11px] font-mono border border-dashed border-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#111827]">
                                    [ No annotations found for this entity block ]
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
