import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createExport, listExports } from "../api";
import { useAuthStore } from "../store/authStore";
import { canSeeAnnotate, canSeeReview, resolveProjectRole } from "../utils/projectRole";
import { getErrorMessage } from "../utils/error";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Cloud, Download, RefreshCcw, Box, CheckCircle2, AlertCircle, Clock, Zap } from "lucide-react";

const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ExportsPage() {
    const navigate = useNavigate();
    const { projectId = "" } = useParams();
    const clearAuth = useAuthStore((s) => s.clear);
    const me = useAuthStore((s) => s.me);

    const [jobs, setJobs] = useState([]);
    const [status, setStatus] = useState("Ready");
    const [busy, setBusy] = useState(false);

    const completedCount = jobs.filter((job) => job.status === "completed").length;
    const failedCount = jobs.filter((job) => job.status === "failed").length;
    const activeCount = jobs.filter((job) => job.status !== "completed" && job.status !== "failed").length;
    const projectRole = resolveProjectRole(me, projectId);

    async function load() {
        const data = await listExports(projectId);
        setJobs(data);
    }

    useEffect(() => {
        load().catch((err) => setStatus(getErrorMessage(err, "Failed loading exports")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    async function trigger(format) {
        setBusy(true);
        try {
            await createExport(projectId, format);
            setStatus(`${format.toUpperCase()} export queued`);
            await load();
        } catch (err) {
            setStatus(getErrorMessage(err, "Export failed"));
        } finally {
            setBusy(false);
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
                        <Cloud className="w-5 h-5" />
                        <span className="text-xs font-mono uppercase tracking-widest font-semibold">Delivery Channel</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Dataset Exporter</h1>
                    <div className="flex items-center gap-3">
                        <span className="flex h-2 w-2 relative">
                            {busy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${busy ? 'bg-primary' : 'bg-gray-500'}`}></span>
                        </span>
                        <span className="text-sm font-mono text-gray-400">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Left Column: Metrics & Actions */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">

                    {/* Metrics Panel */}
                    <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/40 border-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <h2 className="text-xs uppercase tracking-widest text-primary font-mono font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Export Telemetry
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center group overflow-hidden relative">
                                <div className="absolute inset-0 bg-success/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                <span className="text-xs uppercase tracking-wider text-gray-500 relative z-10 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-success" /> Completed
                                </span>
                                <strong className="text-xl font-mono text-white relative z-10">{completedCount}</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center group overflow-hidden relative">
                                <div className="absolute inset-0 bg-warning/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                <span className="text-xs uppercase tracking-wider text-gray-500 relative z-10 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-warning" /> Active/Queued
                                </span>
                                <strong className="text-xl font-mono text-white relative z-10">{activeCount}</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center group overflow-hidden relative">
                                <div className="absolute inset-0 bg-danger/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                <span className="text-xs uppercase tracking-wider text-gray-500 relative z-10 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-danger" /> Failed
                                </span>
                                <strong className="text-xl font-mono text-white relative z-10">{failedCount}</strong>
                            </div>
                        </div>
                    </Card>

                    {/* Trigger Panel */}
                    <Card className="p-5 bg-surface/60 border-t-2 border-t-primary/30">
                        <h2 className="text-lg font-semibold text-white mb-1">Trigger Pipeline</h2>
                        <p className="text-sm text-gray-400 mb-5 border-b border-border/50 pb-5">Package approved annotations into consumable datasets.</p>

                        <div className="space-y-3">
                            <Button
                                disabled={busy}
                                onClick={() => trigger("coco")}
                                className="w-full justify-start h-12 text-xs font-mono tracking-widest uppercase gap-3 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                            >
                                <Box className="w-5 h-5 opacity-70" />
                                Generate COCO Format
                            </Button>
                            <Button
                                disabled={busy}
                                onClick={() => trigger("yolo")}
                                variant="secondary"
                                className="w-full justify-start h-12 text-xs font-mono tracking-widest uppercase gap-3"
                            >
                                <Box className="w-5 h-5 opacity-70" />
                                Generate YOLO Format
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Export Stream */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50 mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Download className="w-5 h-5 text-primary" />
                            Pipeline Artifacts
                        </h2>
                        <Button
                            variant="outline"
                            onClick={load}
                            disabled={busy}
                            size="sm"
                            className="text-xs text-gray-400 hover:text-white border-white/10 flex items-center gap-2"
                        >
                            <RefreshCcw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                            Sync Status
                        </Button>
                    </div>

                    <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-4 w-full">
                        <AnimatePresence>
                            {jobs.map((job) => {
                                const isCompleted = job.status === "completed";
                                const isFailed = job.status === "failed";

                                return (
                                    <motion.div
                                        key={job.id}
                                        variants={itemVariants}
                                        layout
                                        className={`group p-6 rounded-xl border bg-surface/40 backdrop-blur-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all ${isCompleted ? "border-success/30 shadow-[inset_4px_0_0_rgba(0,255,153,1)]" :
                                                isFailed ? "border-danger/30 shadow-[inset_4px_0_0_rgba(255,0,60,1)]" :
                                                    "border-warning/30 shadow-[inset_4px_0_0_rgba(255,184,0,1)]"
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <strong className="text-xl font-mono text-white tracking-widest uppercase">{job.format} Target</strong>
                                                <Badge variant={isCompleted ? "success" : isFailed ? "destructive" : "warning"} className="uppercase tracking-widest text-[9px] animate-in fade-in">
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
                                                <div className="w-full sm:w-48 h-12 flex items-center justify-center rounded-md bg-surface border border-white/5 text-gray-500 font-mono text-xs uppercase tracking-widest gap-2">
                                                    <RefreshCcw className="w-4 h-4 animate-spin opacity-50" />
                                                    Processing...
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {jobs.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-xl bg-surface/20">
                                <Box className="w-16 h-16 text-gray-800 mb-6" />
                                <h3 className="text-lg font-medium text-white mb-2">No Artifacts Generated</h3>
                                <p className="text-gray-500 text-center max-w-sm text-sm">Trigger an export from the pipeline controls to generate a dataset.</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
