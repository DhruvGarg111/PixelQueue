import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Download, RefreshCcw, Box, CheckCircle2, AlertCircle, Clock, Zap, ArrowLeft } from "lucide-react";
import { useExportsList } from "../hooks/useExportsList";
import { ExportCard } from "../components/ExportCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export function ExportsPage() {
    const { projectId = "" } = useParams();
    const { jobs, status, busy, completedCount, failedCount, activeCount, load, trigger } = useExportsList(projectId);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/50">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Link to="/projects" className="text-gray-600 hover:text-ink transition-colors mr-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Cloud className="w-5 h-5" />
                        <span className="text-xs font-mono uppercase tracking-widest font-semibold">Delivery Channel</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-2">Dataset Exporter</h1>
                    <div className="flex items-center gap-3">
                        <span className="flex h-2 w-2 relative">
                            {busy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${busy ? "bg-primary" : "bg-gray-500"}`}></span>
                        </span>
                        <span className="text-sm font-mono text-gray-600">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/40 border-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <h2 className="text-xs uppercase tracking-widest text-primary font-mono font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Export Telemetry
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-white/40 border border-border/5 flex justify-between items-center group overflow-hidden relative">
                                <div className="absolute inset-0 bg-success/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                <span className="text-xs uppercase tracking-wider text-gray-500 relative z-10 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-success" /> Completed
                                </span>
                                <strong className="text-xl font-mono text-ink relative z-10">{completedCount}</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-white/40 border border-border/5 flex justify-between items-center group overflow-hidden relative">
                                <div className="absolute inset-0 bg-warning/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                <span className="text-xs uppercase tracking-wider text-gray-500 relative z-10 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-warning" /> Active/Queued
                                </span>
                                <strong className="text-xl font-mono text-ink relative z-10">{activeCount}</strong>
                            </div>
                            <div className="p-3 rounded-lg bg-white/40 border border-border/5 flex justify-between items-center group overflow-hidden relative">
                                <div className="absolute inset-0 bg-danger/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                <span className="text-xs uppercase tracking-wider text-gray-500 relative z-10 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-danger" /> Failed
                                </span>
                                <strong className="text-xl font-mono text-ink relative z-10">{failedCount}</strong>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 bg-surface/60 border-t-2 border-t-primary/30">
                        <h2 className="text-lg font-semibold text-ink mb-1">Trigger Pipeline</h2>
                        <p className="text-sm text-gray-600 mb-5 border-b border-border/50 pb-5">Package approved annotations into consumable datasets.</p>
                        <div className="space-y-3">
                            <Button disabled={busy} onClick={() => trigger("coco")} className="w-full justify-start h-12 text-xs font-mono tracking-widest uppercase gap-3 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                                <Box className="w-5 h-5 opacity-70" /> Generate COCO Format
                            </Button>
                            <Button disabled={busy} onClick={() => trigger("yolo")} variant="secondary" className="w-full justify-start h-12 text-xs font-mono tracking-widest uppercase gap-3">
                                <Box className="w-5 h-5 opacity-70" /> Generate YOLO Format
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Export Stream */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-border/50 mb-6">
                        <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                            <Download className="w-5 h-5 text-primary" /> Pipeline Artifacts
                        </h2>
                        <Button variant="outline" onClick={load} disabled={busy} size="sm" className="text-xs text-gray-600 hover:text-ink border-border/10 flex items-center gap-2">
                            <RefreshCcw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> Sync Status
                        </Button>
                    </div>

                    <motion.div variants={listVariants} initial="hidden" animate="show" className="grid gap-4 w-full">
                        <AnimatePresence>
                            {jobs.map((job) => (
                                <ExportCard key={job.id} job={job} />
                            ))}
                        </AnimatePresence>
                        {jobs.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/5 rounded-xl bg-surface/20">
                                <Box className="w-16 h-16 text-gray-800 mb-6" />
                                <h3 className="text-lg font-medium text-ink mb-2">No Artifacts Generated</h3>
                                <p className="text-gray-500 text-center max-w-sm text-sm">Trigger an export from the pipeline controls to generate a dataset.</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
