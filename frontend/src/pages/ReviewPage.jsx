import React from "react";
import { Link, useParams } from "react-router-dom";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { ReviewAnnotationCard } from "../components/ReviewAnnotationCard";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

// ⚡ Bolt Optimization: Extracted TaskListItem and wrapped in React.memo to prevent
// re-rendering the entire task stream list when the selectedTaskId changes.
const TaskListItem = React.memo(({ task, isSelected, onSelect }) => {
    return (
        <button
            onClick={() => onSelect(task.id)}
            className={`w-full text-left p-3 rounded flex justify-between items-center transition-colors duration-150 border ${isSelected
                ? "bg-primary/10 border-primary"
                : "bg-background-dark border-primary/20 hover:border-primary/50"
                }`}
        >
            <div>
                <strong className={`font-mono text-sm uppercase tracking-wider ${isSelected ? "text-primary font-bold" : "text-slate-300 font-bold"}`}>
                    N_{task.id.slice(0, 8)}
                </strong>
                <div className="font-mono text-[10px] text-primary/70 mt-1 uppercase font-bold tracking-widest">
                    img: {task.image_id.slice(0, 8)}
                </div>
            </div>
            <Badge variant="secondary" className={`text-[9px] uppercase tracking-wider font-bold py-0.5 px-1.5 h-auto rounded border ${isSelected ? "text-primary border-primary bg-primary/10" : "text-primary/50 border-primary/20 bg-background-dark"}`}>
                {task.status.replace("_", " ")}
            </Badge>
        </button>
    );
});
TaskListItem.displayName = "TaskListItem";

export function ReviewPage() {
    const { projectId = "" } = useParams();
    const {
        tasks, selectedTaskId, setSelectedTaskId,
        bundle, status, bulkProcessing,
        approvedCount, rejectedCount, pendingCount,
        review, approveAll, rejectAll,
    } = useReviewQueue(projectId);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Link to="/projects" className="text-primary/50 hover:text-primary transition-colors duration-150 mr-2 flex items-center">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </Link>
                        <span className="material-symbols-outlined text-[20px]">fact_check</span>
                        <span className="text-[11px] font-mono uppercase tracking-widest font-bold">Quality Control</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1 font-display">Review Queue</h1>
                    <div className="flex items-center gap-3 mt-2 bg-primary/5 border border-primary/20 rounded px-3 py-1 w-fit">
                        <span className="flex h-2 w-2 relative">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary animate-pulse"></span>
                        </span>
                        <span className="text-xs font-mono text-primary font-bold tracking-wider">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column: Tasks */}
                <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
                    <div className="p-4 rounded-lg border border-primary/20 bg-background-dark/80">
                        <h2 className="text-[11px] uppercase tracking-widest text-primary font-mono font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">history</span> Active Block
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-background-dark border border-primary/20 flex flex-col items-center justify-center rounded">
                                <strong className="text-2xl font-mono text-slate-100 leading-none">{tasks.length}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-primary/70 font-mono font-bold mt-1">Pending</span>
                            </div>
                            <div className="p-3 bg-background-dark border border-primary/20 flex flex-col items-center justify-center rounded">
                                <strong className="text-2xl font-mono text-slate-100 leading-none">{approvedCount + rejectedCount}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-primary/70 font-mono font-bold mt-1">Processed</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col max-h-[600px] border border-primary/20 bg-background-dark/80 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-primary/20">
                            <h2 className="text-sm font-bold text-primary/70 uppercase font-mono tracking-wider">Task Stream</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-[#0A1112]">
                            {tasks.map((task) => (
                                <TaskListItem
                                    key={task.id}
                                    task={task}
                                    isSelected={selectedTaskId === task.id}
                                    onSelect={setSelectedTaskId}
                                />
                            ))}
                            {tasks.length === 0 && (
                                <div className="py-12 text-center text-primary/50 text-[11px] font-mono border border-dashed border-primary/30 rounded m-2 uppercase tracking-widest font-bold">
                                    [ Stream is empty ]
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Annotation Entities */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-primary/20 mb-6">
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-display">
                            <span className="material-symbols-outlined text-primary text-[24px]">checklist</span> Annotation Entities
                        </h2>
                        {bundle && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={rejectAll}
                                    disabled={bundle.annotations.filter((a) => a.status !== "rejected").length === 0 || bulkProcessing}
                                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 font-mono text-[10px] tracking-widest uppercase font-bold gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">cancel</span> Reject All
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={approveAll}
                                    disabled={pendingCount === 0 || bulkProcessing}
                                    className="border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10 hover:border-[#10B981] font-mono text-[10px] tracking-widest uppercase font-bold gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    {bulkProcessing ? "Processing..." : "Approve All Visible"}
                                </Button>
                            </div>
                        )}
                    </div>

                    {!bundle && (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 border border-dashed border-primary/30 rounded-lg bg-primary/5">
                            <span className="material-symbols-outlined text-[48px] text-primary/30 mb-4">play_circle</span>
                            <h3 className="text-base font-bold text-slate-100 mb-1 font-mono uppercase tracking-widest">Awaiting Selection</h3>
                            <p className="text-slate-400 text-center max-w-sm text-sm">Select a task from the stream to begin quality control review.</p>
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
                                <div className="py-16 text-center text-primary/50 text-[11px] font-mono border border-dashed border-primary/30 rounded-lg bg-primary/5 font-bold uppercase tracking-widest">
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
