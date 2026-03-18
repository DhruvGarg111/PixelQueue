import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { logout as logoutRequest } from "../api";
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
    const [loggingOut, setLoggingOut] = useState(false);

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

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await logoutRequest();
        } catch {
            // Best effort logout.
        } finally {
            clearAuth();
            navigate("/login", { replace: true });
            setLoggingOut(false);
        }
    }

    return (
        <div className="flex flex-col h-screen max-h-screen bg-background-dark overflow-hidden font-display text-slate-100">
            <header className="h-16 flex-shrink-0 border-b border-primary/20 bg-background-dark/80 backdrop-blur px-4 flex items-center justify-between z-10 w-full">
                <div className="flex flex-1 items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Link to="/projects" className="text-primary/50 hover:text-primary transition-colors duration-150">
                            <span className="material-symbols-outlined text-[24px]">dashboard</span>
                        </Link>
                        <div className="w-px h-6 bg-primary/20" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-primary/70 font-mono tracking-widest uppercase font-bold">Active Task</span>
                            <span className="font-mono text-sm text-primary font-bold tracking-wider">
                                {task ? task.id.slice(0, 8) : "AWAITING"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4 bg-primary/5 rounded border border-primary/20 px-3 py-1">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary animate-pulse"></span>
                        <span className="text-xs text-primary font-mono font-bold">{status}</span>
                        {saving && <span className="text-xs text-[#F59E0B] font-mono ml-2 font-bold">Autosaving...</span>}
                    </div>
                </div>

                <div className="flex flex-1 justify-center px-4">
                    <ToolPalette />
                </div>

                <div className="flex flex-1 justify-end items-center gap-3">
                    <div className="hidden md:flex items-center gap-4 mr-4 text-xs font-mono text-primary/70 font-bold">
                        <span className="flex gap-1.5 items-center">TOT: <strong className="text-slate-100">{annotations.length}</strong></span>
                        <span className="flex gap-1.5 items-center">MAN: <strong className="text-slate-100">{manualCount}</strong></span>
                        <span className="flex gap-1.5 items-center text-primary">
                            <span className="material-symbols-outlined text-[14px]">memory</span> AUTO: <strong className="text-primary">{autoCount}</strong>
                        </span>
                        <Badge variant="outline" className="border-primary/30 text-primary">REV {revision}</Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="text-primary/50 hover:text-red-400 hover:bg-red-400/10"
                    >
                        <span className={`material-symbols-outlined text-[16px] ${loggingOut ? "animate-pulse" : ""}`}>logout</span>
                    </Button>
                </div>
            </header>

            <div className="h-12 flex-shrink-0 border-b border-primary/20 bg-background-dark/95 px-4 flex items-center justify-between z-10 w-full">
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleLoadNext} className="h-8 text-xs font-mono font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                        <span className="material-symbols-outlined text-[14px] mr-2">fast_forward</span> Load Next Chunk
                    </Button>
                    <Button variant="outline" size="sm" onClick={onAutoLabel} disabled={!task} className="h-8 text-xs font-mono border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-bold">
                        <span className="material-symbols-outlined text-[14px] mr-2">memory</span> Auto-Process
                    </Button>
                    <label className="inline-flex items-center justify-center rounded text-xs font-bold transition-colors duration-150 border border-primary/20 bg-background-dark text-slate-100 hover:bg-primary/5 hover:text-primary h-8 px-3 cursor-pointer font-mono uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px] mr-2">upload</span>
                        {uploading ? "Ingesting..." : "Ingest Media"}
                        <input type="file" accept="image/*" multiple onChange={onUpload} hidden disabled={uploading} />
                    </label>
                </div>
                <div className="flex gap-2">
                    {canSeeReview(projectRole) && (
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-slate-300 font-bold hover:text-primary hover:bg-primary/5 uppercase tracking-wider">
                            <Link to={`/projects/${projectId}/review`}><span className="material-symbols-outlined text-[14px] mr-2">checklist</span> Review Space</Link>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-slate-400 font-bold hover:text-primary hover:bg-primary/5 uppercase tracking-wider">
                        <Link to={`/projects/${projectId}/exports`}><span className="material-symbols-outlined text-[14px] mr-2">download</span> Exports</Link>
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex min-h-0 bg-background-dark/50 p-4">
                <div className="flex-1 relative flex overflow-hidden rounded bg-[#0A1112] shadow-none min-h-[400px]">
                    {!task?.image ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center m-8 border border-primary/20 rounded-lg bg-primary/5">
                            <span className="material-symbols-outlined text-[48px] text-primary/30 mb-4">desktop_windows</span>
                            <h3 className="text-base font-bold text-slate-100 mb-1 font-mono uppercase tracking-widest">Matrix Offline</h3>
                            <p className="text-slate-400 text-center max-w-sm text-sm">Ingest media or load a chunk to initialize the annotation canvas.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ cursor: "crosshair" }}>
                            <CanvasStage imageUrl={task.image.download_url || ""} imageWidth={task.image.width} imageHeight={task.image.height} />
                        </div>
                    )}
                </div>

                <div className="w-80 flex-shrink-0 flex flex-col z-20 ml-4 rounded border border-primary/20 bg-background-dark/80 overflow-hidden">
                    {task?.image ? (
                        <div className="h-full overflow-y-auto w-full custom-scrollbar">
                            <AnnotationSidebar />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary/50 animate-pulse">Awaiting Data stream...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
