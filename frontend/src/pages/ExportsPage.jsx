import { useParams, Link } from "react-router-dom";
import { useExportsList } from "../hooks/useExportsList";
import { ExportCard } from "../components/ExportCard";
import { Button } from "../components/ui/Button";

export function ExportsPage() {
    const { projectId = "" } = useParams();
    const { jobs, status, busy, completedCount, failedCount, activeCount, load, trigger } = useExportsList(projectId);

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Link to="/projects" className="text-primary/50 hover:text-primary transition-colors duration-150 mr-2 flex items-center">
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </Link>
                        <span className="material-symbols-outlined text-[20px]">cloud</span>
                        <span className="text-[11px] font-mono uppercase tracking-widest font-bold">Delivery Channel</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100 mb-1 font-display">Dataset Exporter</h1>
                    <div className="flex items-center gap-3 mt-2 bg-primary/5 border border-primary/20 rounded px-3 py-1 w-fit">
                        <span className="flex h-2 w-2 relative">
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${busy ? "bg-primary animate-pulse" : "bg-primary/30"}`}></span>
                        </span>
                        <span className="text-xs font-mono text-primary font-bold tracking-wider">{status}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <div className="p-4 rounded-lg border border-primary/20 bg-background-dark/80">
                        <h2 className="text-[11px] uppercase tracking-widest text-primary font-mono font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">bolt</span> Export Telemetry
                        </h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-background-dark border border-primary/20 flex justify-between items-center rounded">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-primary/70 flex items-center gap-2 font-bold">
                                    <span className="material-symbols-outlined text-[16px] text-[#10B981]">check_circle</span> Completed
                                </span>
                                <strong className="text-lg font-mono text-slate-100">{completedCount}</strong>
                            </div>
                            <div className="p-3 bg-background-dark border border-primary/20 flex justify-between items-center rounded">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-primary/70 flex items-center gap-2 font-bold">
                                    <span className="material-symbols-outlined text-[16px] text-[#F59E0B]">schedule</span> Active/Queued
                                </span>
                                <strong className="text-lg font-mono text-slate-100">{activeCount}</strong>
                            </div>
                            <div className="p-3 bg-background-dark border border-primary/20 flex justify-between items-center rounded">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-primary/70 flex items-center gap-2 font-bold">
                                    <span className="material-symbols-outlined text-[16px] text-red-500">error</span> Failed
                                </span>
                                <strong className="text-lg font-mono text-slate-100">{failedCount}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-lg border border-primary/20 bg-background-dark/80">
                        <h2 className="text-sm font-bold text-primary/70 font-mono uppercase tracking-wider mb-2">Trigger Pipeline</h2>
                        <p className="text-xs text-slate-400 mb-5 border-b border-primary/20 pb-5">Package approved annotations into consumable datasets.</p>
                        <div className="space-y-3">
                            <Button disabled={busy} onClick={() => trigger("coco")} variant="outline" className="w-full justify-start h-10 text-[10px] font-mono tracking-widest uppercase font-bold text-primary border-primary/30 hover:bg-primary/10 gap-3">
                                <span className="material-symbols-outlined text-[16px] opacity-70">view_in_ar</span> Generate COCO Format
                            </Button>
                            <Button disabled={busy} onClick={() => trigger("yolo")} variant="outline" className="w-full justify-start h-10 text-[10px] font-mono tracking-widest uppercase font-bold text-primary border-primary/30 hover:bg-primary/10 gap-3">
                                <span className="material-symbols-outlined text-[16px] opacity-70">view_in_ar</span> Generate YOLO Format
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Export Stream */}
                <div className="flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center pb-4 border-b border-primary/20 mb-6">
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-display">
                            <span className="material-symbols-outlined text-primary text-[24px]">download</span> Pipeline Artifacts
                        </h2>
                        <Button variant="outline" onClick={load} disabled={busy} size="sm" className="text-[10px] uppercase tracking-widest font-mono font-bold text-primary border-primary/30 hover:bg-primary/10 flex items-center gap-2 h-8">
                            <span className={`material-symbols-outlined text-[16px] ${busy ? "animate-spin" : ""}`}>sync</span> Sync Status
                        </Button>
                    </div>

                    <div className="grid gap-4 w-full">
                        {jobs.map((job) => (
                            <ExportCard key={job.id} job={job} />
                        ))}
                        {jobs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-primary/30 rounded-lg bg-primary/5">
                                <span className="material-symbols-outlined text-[48px] text-primary/30 mb-4">view_in_ar</span>
                                <h3 className="text-base font-bold text-slate-100 mb-1 font-mono uppercase tracking-widest">No Artifacts Generated</h3>
                                <p className="text-slate-400 text-center max-w-sm text-sm">Trigger an export from the pipeline controls.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
