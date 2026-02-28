import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAnnotations, listTasks, reviewAnnotation } from "../api";
import { useAuthStore } from "../store/authStore";
import { canSeeAnnotate, resolveProjectRole } from "../utils/projectRole";
import { getErrorMessage } from "../utils/error";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { CheckSquare, XCircle, CheckCircle2, AlertCircle, PlayCircle, History, ListChecks, Download } from "lucide-react";

const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ReviewPage() {
    const navigate = useNavigate();
    const { projectId = "" } = useParams();
    const clearAuth = useAuthStore((s) => s.clear);
    const me = useAuthStore((s) => s.me);
    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [bundle, setBundle] = useState(null);
    const [status, setStatus] = useState("Ready");
    const [bulkApproving, setBulkApproving] = useState(false);

    const approvedCount = bundle ? bundle.annotations.filter((ann) => ann.status === "approved").length : 0;
    const rejectedCount = bundle ? bundle.annotations.filter((ann) => ann.status === "rejected").length : 0;
    const pendingApprovalCount = bundle ? bundle.annotations.filter((ann) => ann.status !== "approved").length : 0;
    const projectRole = resolveProjectRole(me, projectId);

    async function loadTasks() {
        const taskRows = await listTasks(projectId, "in_review");
        setTasks(taskRows);
        if (!selectedTaskId && taskRows.length > 0) {
            setSelectedTaskId(taskRows[0].id);
        }
    }

    useEffect(() => {
        loadTasks().catch((err) => setStatus(getErrorMessage(err, "Failed loading tasks")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    useEffect(() => {
        if (!selectedTaskId) return;
        const task = tasks.find((t) => t.id === selectedTaskId);
        if (!task) {
            setBundle(null);
            setSelectedTaskId(tasks.length > 0 ? tasks[0].id : null);
            return;
        }

        getAnnotations(task.image_id)
            .then((nextBundle) => setBundle(nextBundle))
            .catch((err) => setStatus(getErrorMessage(err, "Failed loading annotations")));
    }, [selectedTaskId, tasks]);

    async function review(id, action) {
        try {
            await reviewAnnotation(id, action);
            const nextStatus = action === "approve" ? "approved" : "rejected";
            setStatus(`Annotation ${nextStatus}`);

            setBundle((current) =>
                current
                    ? {
                        ...current,
                        annotations: current.annotations.map((ann) => (ann.id === id ? { ...ann, status: nextStatus } : ann)),
                    }
                    : current,
            );

            if (!bundle) return;
            const fresh = await getAnnotations(bundle.image_id);
            setBundle(fresh);
            await loadTasks();
        } catch (err) {
            setStatus(getErrorMessage(err, "Review failed"));
        }
    }

    async function approveAll() {
        if (!bundle) return;
        const candidates = bundle.annotations.filter((ann) => ann.status !== "approved");
        if (candidates.length === 0) {
            setStatus("All annotations are already approved");
            return;
        }

        setBulkApproving(true);
        setStatus(`Approving ${candidates.length} annotations...`);

        try {
            const results = await Promise.allSettled(candidates.map((ann) => reviewAnnotation(ann.id, "approve")));
            const approvedNow = results.filter((result) => result.status === "fulfilled").length;
            const failed = results.length - approvedNow;

            const fresh = await getAnnotations(bundle.image_id);
            setBundle(fresh);
            await loadTasks();

            if (failed === 0) {
                setStatus(`Approved ${approvedNow} annotation${approvedNow === 1 ? "" : "s"}`);
            } else {
                setStatus(`Approved ${approvedNow}, failed ${failed}`);
            }
        } catch (err) {
            setStatus(getErrorMessage(err, "Approve all failed"));
        } finally {
            setBulkApproving(false);
        }
    }

    function logout() {
        clearAuth();
        navigate("/login");
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/50">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <ListChecks className="w-5 h-5" />
                        <span className="text-xs font-mono uppercase tracking-widest font-semibold">Quality Control</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Review Queue</h1>
                    <div className="flex items-center gap-3">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-sm font-mono text-gray-400">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Column: Tasks */}
                <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
                    {/* Metrics Panel */}
                    <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/40 border-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <h2 className="text-xs uppercase tracking-widest text-primary font-mono font-semibold mb-4 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Active Block
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <strong className="text-3xl font-mono text-white relative z-10">{tasks.length}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 relative z-10 text-center">Tasks Pending</span>
                            </div>
                            <div className="p-4 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-success/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <strong className="text-3xl font-mono text-white relative z-10">{approvedCount + rejectedCount}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 relative z-10 text-center">Processed</span>
                            </div>
                        </div>
                    </Card>

                    {/* Task Stream */}
                    <Card className="p-0 border-t-2 border-t-primary/30 flex flex-col max-h-[600px]">
                        <div className="p-5 border-b border-white/5">
                            <h2 className="text-lg font-semibold text-white mb-1">Task Stream</h2>
                            <p className="text-xs text-gray-400">Queue representing chunks ready for QC.</p>
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
                                                : "bg-surface/50 border-white/5 hover:border-white/20 hover:bg-surface"
                                            }`}
                                    >
                                        <div>
                                            <strong className={`font-mono text-sm ${selectedTaskId === task.id ? "text-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" : "text-gray-200"}`}>
                                                {task.id.slice(0, 8)}
                                            </strong>
                                            <div className="font-mono text-xs text-gray-500 mt-1">
                                                img: <span className="text-gray-400">{task.image_id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${selectedTaskId === task.id ? "border-primary/50 text-primary" : "border-white/10 text-gray-500"
                                            }`}>
                                            {task.status.replace("_", " ")}
                                        </Badge>
                                    </motion.button>
                                ))}
                            </AnimatePresence>

                            {tasks.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-gray-500 text-sm font-mono border border-dashed border-white/10 rounded-xl m-2">
                                    [ Stream is empty ]
                                </motion.div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Annotation Entities */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50 mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-primary" />
                            Annotation Entities
                        </h2>
                        {bundle && (
                            <Button
                                variant="outline"
                                onClick={approveAll}
                                disabled={pendingApprovalCount === 0 || bulkApproving}
                                className="border-success/50 text-success hover:bg-success/10 bg-success/5 font-mono text-xs tracking-widest uppercase gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {bulkApproving ? "Processing..." : "Approve All Visible"}
                            </Button>
                        )}
                    </div>

                    {!bundle && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/5 rounded-xl bg-surface/20">
                            <PlayCircle className="w-16 h-16 text-gray-800 mb-6" />
                            <h3 className="text-xl font-medium text-white mb-2">Awaiting Selection</h3>
                            <p className="text-gray-500 text-center max-w-sm">Select a task from the stream to begin quality control review.</p>
                        </motion.div>
                    )}

                    {bundle && (
                        <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-4 w-full">
                            <AnimatePresence>
                                {bundle.annotations.map((ann) => {
                                    const isApproved = ann.status === "approved";
                                    const isRejected = ann.status === "rejected";
                                    const isPending = !isApproved && !isRejected;

                                    return (
                                        <motion.div key={ann.id} variants={itemVariants} layout className={`group p-5 rounded-xl border bg-surface/40 backdrop-blur-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all ${isApproved ? "border-success/30 shadow-[inset_4px_0_0_rgba(0,255,153,1)]" :
                                                isRejected ? "border-danger/30 shadow-[inset_4px_0_0_rgba(255,0,60,1)]" :
                                                    "border-warning/30 shadow-[inset_4px_0_0_rgba(255,184,0,1)]"
                                            }`}>
                                            <div className="flex-1 pl-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <strong className="text-lg font-bold text-white tracking-wide">{ann.label}</strong>
                                                    <Badge variant={isApproved ? "success" : isRejected ? "destructive" : "warning"} className="uppercase tracking-widest text-[9px]">
                                                        {ann.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-gray-400">
                                                    <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded">
                                                        <span className="text-gray-500">SRC:</span> <span className={ann.source === "manual" ? "text-white" : "text-primary"}>{ann.source.toUpperCase()}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded">
                                                        <span className="text-gray-500">TYPE:</span> <span className="text-white">{ann.geometry.type.toUpperCase()}</span>
                                                    </span>
                                                    {ann.confidence !== null && ann.confidence !== undefined && (
                                                        <span className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded">
                                                            <span className="text-gray-500">CONF:</span> <span className={ann.confidence > 0.8 ? "text-success" : "text-warning"}>{ann.confidence.toFixed(2)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0 opacity-100 transition-opacity">
                                                <Button
                                                    disabled={bulkApproving}
                                                    onClick={() => review(ann.id, "approve")}
                                                    variant="outline"
                                                    className={`w-full sm:w-28 font-mono tracking-widest text-xs h-10 ${isApproved
                                                            ? "bg-success border-success text-success-foreground hover:bg-success/90"
                                                            : "bg-success/5 border-success/30 text-success hover:bg-success/10 hover:border-success/50"
                                                        }`}
                                                >
                                                    {isApproved ? "PASSED" : "PASS"}
                                                </Button>
                                                <Button
                                                    disabled={bulkApproving}
                                                    onClick={() => review(ann.id, "reject")}
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
                                })}
                            </AnimatePresence>

                            {bundle.annotations.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center text-gray-500 text-sm font-mono border border-dashed border-white/10 rounded-xl bg-surface/10">
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
