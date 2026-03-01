import { Link, useNavigate, useParams } from "react-router-dom";
import { MonitorPlay, Download, Cpu, FastForward, Upload, LogOut, CheckSquare } from "lucide-react";
import { useAnnotationStore } from "../store/annotationStore";
import { useAuthStore } from "../store/authStore";
import { canSeeReview, resolveProjectRole } from "../utils/projectRole";
import { useAnnotationTask } from "../hooks/useAnnotationTask";
import { useImageUpload } from "../hooks/useImageUpload";
import { AnnotationSidebar } from "../components/AnnotationSidebar";
import { CanvasStage } from "../components/CanvasStage";
import { ToolPalette } from "../components/ToolPalette";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export function AnnotatePage() {
    const navigate = useNavigate();
    const { projectId = "" } = useParams();
    const clearAuth = useAuthStore((s) => s.clear);
    const me = useAuthStore((s) => s.me);
    const annotations = useAnnotationStore((s) => s.annotations);

    const projectRole = resolveProjectRole(me, projectId);
    const manualCount = annotations.filter((item) => item.source === "manual").length;
    const autoCount = annotations.filter((item) => item.source !== "manual").length;

    const {
        task, revision, status, saving,
        handleLoadNext, loadNext, onAutoLabel, setStatus,
    } = useAnnotationTask(projectId);

    const { uploading, onUpload } = useImageUpload(projectId, {
        onComplete: () => loadNext(),
        onStatusChange: setStatus,
    });

    const logout = () => { clearAuth(); navigate("/login"); };

    return (
        <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden">
            {/* Top Toolbar */}
            <header className="h-16 flex-shrink-0 border-b border-[rgba(255,255,255,0.06)] bg-[#111827] px-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Link to="/projects" className="text-ink-faint hover:text-ink transition-colors duration-150">
                            <MonitorPlay className="w-5 h-5" />
                        </Link>
                        <div className="w-px h-6 bg-[rgba(255,255,255,0.06)]" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-ink-faint font-mono tracking-widest uppercase">Active Task</span>
                            <span className="font-mono text-sm text-primary font-bold">
                                {task ? task.id.slice(0, 8) : "AWAITING"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4 bg-[rgba(255,255,255,0.04)] rounded-[8px] px-3 py-1 border border-[rgba(255,255,255,0.06)]">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        <span className="text-xs text-ink-muted font-mono">{status}</span>
                        {saving && <span className="text-xs text-warning font-mono ml-2">Autosaving...</span>}
                    </div>
                </div>

                <div className="flex flex-1 justify-center px-4">
                    <ToolPalette />
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-4 mr-4 text-xs font-mono text-ink-faint">
                        <span className="flex gap-1.5 items-center">TOT: <strong className="text-ink">{annotations.length}</strong></span>
                        <span className="flex gap-1.5 items-center">MAN: <strong className="text-ink">{manualCount}</strong></span>
                        <span className="flex gap-1.5 items-center text-primary">
                            <Cpu className="w-3 h-3" /> AUTO: <strong className="text-primary">{autoCount}</strong>
                        </span>
                        <Badge variant="outline" className="border-[rgba(255,255,255,0.1)]">REV {revision}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={logout} className="text-ink-faint hover:text-danger">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Action Bar */}
            <div className="h-12 flex-shrink-0 border-b border-[rgba(255,255,255,0.06)] bg-[#0F172A] px-4 flex items-center justify-between z-10">
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleLoadNext} className="h-8 text-xs font-mono">
                        <FastForward className="w-3.5 h-3.5 mr-2" /> Load Next Chunk
                    </Button>
                    <Button variant="outline" size="sm" onClick={onAutoLabel} disabled={!task} className="h-8 text-xs font-mono border-warning/30 text-warning hover:bg-warning/10">
                        <Cpu className="w-3.5 h-3.5 mr-2" /> Auto-Process
                    </Button>
                    <label className="inline-flex items-center justify-center rounded-[8px] text-xs font-medium transition-colors duration-150 border border-[rgba(255,255,255,0.1)] bg-transparent text-ink hover:bg-[rgba(255,255,255,0.05)] h-8 px-3 cursor-pointer font-mono">
                        <Upload className="w-3.5 h-3.5 mr-2" />
                        {uploading ? "Ingesting..." : "Ingest Media"}
                        <input type="file" accept="image/*" multiple onChange={onUpload} hidden disabled={uploading} />
                    </label>
                </div>
                <div className="flex gap-2">
                    {canSeeReview(projectRole) && (
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                            <Link to={`/projects/${projectId}/review`}><CheckSquare className="w-3.5 h-3.5 mr-2" /> Review Space</Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-ink-muted">
                        <Link to={`/projects/${projectId}/exports`}><Download className="w-3.5 h-3.5 mr-2" /> Exports</Link>
                    </Button>
                </div>
            </div>

            {/* Canvas & Sidebar */}
            <div className="flex-1 flex min-h-0 bg-[#020617] p-4">
                <div className="flex-1 relative flex overflow-hidden rounded-[8px] border border-[rgba(59,130,246,0.4)] bg-[#0F172A] shadow-none">
                    {!task?.image ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center m-8 border border-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#111827]">
                            <MonitorPlay className="w-12 h-12 text-ink-faint mb-4" />
                            <h3 className="text-base font-semibold text-ink mb-1">Matrix Offline</h3>
                            <p className="text-ink-muted text-center max-w-sm text-sm">Ingest media or load a chunk to initialize the annotation canvas.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ cursor: "crosshair" }}>
                            <CanvasStage imageUrl={task.image.download_url || ""} imageWidth={task.image.width} imageHeight={task.image.height} />
                        </div>
                    )}
                </div>

                <div className="w-80 flex-shrink-0 flex flex-col z-20 ml-4 rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#111827] overflow-hidden">
                    {task?.image ? (
                        <div className="h-full overflow-y-auto w-full custom-scrollbar">
                            <AnnotationSidebar />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">Awaiting Data stream...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
