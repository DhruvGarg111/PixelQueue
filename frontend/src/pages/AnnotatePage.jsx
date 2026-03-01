import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
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
            <header className="h-16 flex-shrink-0 border-b border-border/50 bg-surface/90 backdrop-blur-md px-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Link to="/projects" className="text-gray-600 hover:text-ink transition-colors">
                            <MonitorPlay className="w-5 h-5" />
                        </Link>
                        <div className="w-px h-6 bg-border/50" />
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-mono tracking-wider uppercase">Active Task</span>
                            <span className="font-mono text-sm text-primary font-bold">
                                {task ? task.id.slice(0, 8) : "AWAITING"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4 bg-white/30 rounded-full px-3 py-1 border border-border/5">
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs text-gray-600 font-mono">{status}</span>
                        {saving && <span className="text-xs text-warning font-mono ml-2">Autosaving...</span>}
                    </div>
                </div>

                <div className="flex flex-1 justify-center px-4">
                    <ToolPalette />
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-4 mr-4 text-xs font-mono text-gray-500">
                        <span className="flex gap-1.5 items-center">TOT: <strong className="text-ink">{annotations.length}</strong></span>
                        <span className="flex gap-1.5 items-center">MAN: <strong className="text-ink">{manualCount}</strong></span>
                        <span className="flex gap-1.5 items-center text-primary">
                            <Cpu className="w-3 h-3" /> AUTO: <strong className="text-primary">{autoCount}</strong>
                        </span>
                        <Badge variant="outline" className="border-border">REV {revision}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={logout} className="text-gray-600 hover:text-danger">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Action Bar */}
            <div className="h-12 flex-shrink-0 border-b border-border/30 bg-white/40 px-4 flex items-center justify-between z-10">
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleLoadNext} className="h-8 text-xs font-mono">
                        <FastForward className="w-3.5 h-3.5 mr-2" /> Load Next Chunk
                    </Button>
                    <Button variant="outline" size="sm" onClick={onAutoLabel} disabled={!task} className="h-8 text-xs font-mono border-warning/30 text-warning hover:bg-warning/10">
                        <Cpu className="w-3.5 h-3.5 mr-2" /> Auto-Process
                    </Button>
                    <label className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-border bg-background hover:bg-surface hover:text-primary h-8 px-3 cursor-pointer font-mono">
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
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-gray-600">
                        <Link to={`/projects/${projectId}/exports`}><Download className="w-3.5 h-3.5 mr-2" /> Exports</Link>
                    </Button>
                </div>
            </div>

            {/* Canvas & Sidebar */}
            <div className="flex-1 flex min-h-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]">
                <div className="flex-1 relative flex overflow-hidden">
                    {!task?.image ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center m-8 border-2 border-dashed border-border/5 rounded-2xl bg-white/50 backdrop-blur-sm">
                            <MonitorPlay className="w-16 h-16 text-gray-800 mb-6" />
                            <h3 className="text-xl font-medium text-ink mb-2">Matrix Offline</h3>
                            <p className="text-gray-500 text-center max-w-sm">Ingest media or load a chunk to initialize the annotation canvas.</p>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full h-full flex items-center justify-center overflow-hidden" style={{ cursor: "crosshair" }}>
                            <CanvasStage imageUrl={task.image.download_url || ""} imageWidth={task.image.width} imageHeight={task.image.height} />
                        </motion.div>
                    )}
                </div>

                <motion.div initial={{ x: 300 }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-80 flex-shrink-0 border-l border-border/50 bg-surface/80 backdrop-blur-xl flex flex-col shadow-2xl z-20">
                    {task?.image ? (
                        <div className="h-full overflow-y-auto w-full custom-scrollbar">
                            <AnnotationSidebar />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center opacity-30">
                            <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Awaiting Data stream...</span>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
