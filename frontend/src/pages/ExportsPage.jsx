import { useParams, Link } from "react-router-dom";
import { Cloud, Download, RefreshCcw, Box, CheckCircle2, AlertCircle, Clock, Zap, ArrowLeft } from "lucide-react";
import { useExportsList } from "../hooks/useExportsList";
import { ExportCard } from "../components/ExportCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function ExportsPage() {
    const { projectId = "" } = useParams();
    const { jobs, status, busy, completedCount, failedCount, activeCount, load, trigger } = useExportsList(projectId);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Link to="/projects" className="text-ink-faint hover:text-ink transition-colors duration-150 mr-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <Cloud className="w-5 h-5" />
                        <span className="text-[11px] font-mono uppercase tracking-widest font-semibold">Delivery Channel</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-ink mb-1 font-display">Dataset Exporter</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex h-2 w-2 relative">
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${busy ? "bg-[#3B82F6]" : "bg-ink-faint"}`}></span>
                        </span>
                        <span className="text-xs font-mono text-ink-muted">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <Card className="p-4 shadow-none bg-[#111827] border-[rgba(255,255,255,0.06)]">
                        <h2 className="text-[11px] uppercase tracking-widest text-primary font-mono font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Export Telemetry
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-[#020617] border border-[rgba(255,255,255,0.06)] flex justify-between items-center rounded-[8px]">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-success" /> Completed
                                </span>
                                <strong className="text-lg font-mono text-ink">{completedCount}</strong>
                            </div>
                            <div className="p-3 bg-[#020617] border border-[rgba(255,255,255,0.06)] flex justify-between items-center rounded-[8px]">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-warning" /> Active/Queued
                                </span>
                                <strong className="text-lg font-mono text-ink">{activeCount}</strong>
                            </div>
                            <div className="p-3 bg-[#020617] border border-[rgba(255,255,255,0.06)] flex justify-between items-center rounded-[8px]">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-danger" /> Failed
                                </span>
                                <strong className="text-lg font-mono text-ink">{failedCount}</strong>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 shadow-none border-[rgba(255,255,255,0.06)] bg-[#111827]">
                        <h2 className="text-sm font-semibold text-ink-faint font-mono uppercase tracking-wider mb-2">Trigger Pipeline</h2>
                        <p className="text-xs text-ink-muted mb-5 border-b border-[rgba(255,255,255,0.06)] pb-5">Package approved annotations into consumable datasets.</p>
                        <div className="space-y-3">
                            <Button disabled={busy} onClick={() => trigger("coco")} variant="outline" className="w-full justify-start h-10 text-[10px] font-mono tracking-widest uppercase gap-3">
                                <Box className="w-4 h-4 opacity-70" /> Generate COCO Format
                            </Button>
                            <Button disabled={busy} onClick={() => trigger("yolo")} variant="outline" className="w-full justify-start h-10 text-[10px] font-mono tracking-widest uppercase gap-3">
                                <Box className="w-4 h-4 opacity-70" /> Generate YOLO Format
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Export Stream */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-[rgba(255,255,255,0.06)] mb-6">
                        <h2 className="text-lg font-semibold text-ink flex items-center gap-2 font-display">
                            <Download className="w-5 h-5 text-primary" /> Pipeline Artifacts
                        </h2>
                        <Button variant="outline" onClick={load} disabled={busy} size="sm" className="text-[10px] uppercase tracking-widest font-mono text-ink border-[rgba(255,255,255,0.1)] flex items-center gap-2 h-8">
                            <RefreshCcw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> Sync Status
                        </Button>
                    </div>

                    <div className="grid gap-4 w-full">
                        {jobs.map((job) => (
                            <ExportCard key={job.id} job={job} />
                        ))}
                        {jobs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#111827]">
                                <Box className="w-12 h-12 text-ink-faint mb-4" />
                                <h3 className="text-base font-medium text-ink mb-1">No Artifacts Generated</h3>
                                <p className="text-ink-muted text-center max-w-sm text-sm">Trigger an export from the pipeline controls.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
