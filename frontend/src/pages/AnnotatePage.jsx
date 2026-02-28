import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
    commitUpload,
    getAnnotations,
    nextTask,
    presignUpload,
    saveAnnotations,
    triggerAutoLabel,
} from "../api";
import { API_URL } from "../api/client";
import { AnnotationSidebar } from "../components/AnnotationSidebar";
import { CanvasStage } from "../components/CanvasStage";
import { ToolPalette } from "../components/ToolPalette";
import { useAnnotationStore } from "../store/annotationStore";
import { useAuthStore } from "../store/authStore";
import { canSeeReview, resolveProjectRole } from "../utils/projectRole";
import { getErrorMessage } from "../utils/error";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { MonitorPlay, Settings, Download, Cpu, FastForward, Upload, LogOut } from "lucide-react";

async function getImageDimensions(file) {
    const bitmap = await createImageBitmap(file);
    try {
        return { width: bitmap.width, height: bitmap.height };
    } finally {
        bitmap.close?.();
    }
}

function normalizeUploadError(error) {
    return getErrorMessage(error, "Upload failed");
}

export function AnnotatePage() {
    const navigate = useNavigate();
    const { projectId = "" } = useParams();
    const token = useAuthStore((s) => s.accessToken);
    const clearAuth = useAuthStore((s) => s.clear);
    const me = useAuthStore((s) => s.me);

    const annotations = useAnnotationStore((s) => s.annotations);
    const setAnnotationsFromServer = useAnnotationStore((s) => s.setAnnotationsFromServer);
    const resetStore = useAnnotationStore((s) => s.reset);

    const [task, setTask] = useState(null);
    const [revision, setRevision] = useState(0);
    const [hydrating, setHydrating] = useState(false);
    const [status, setStatus] = useState("Ready");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const revisionRef = useRef(0);
    const skipNextAutosaveRef = useRef(true);
    const taskRef = useRef(null);

    const manualCount = annotations.filter((item) => item.source === "manual").length;
    const autoCount = annotations.filter((item) => item.source !== "manual").length;
    const projectRole = resolveProjectRole(me, projectId);

    async function loadNext(excludeTaskId = null) {
        setStatus("Loading next task...");
        setHydrating(true);
        try {
            const next = await nextTask(projectId, excludeTaskId || undefined);
            setTask(next);
            skipNextAutosaveRef.current = true;

            const bundle = await getAnnotations(next.image_id);
            setAnnotationsFromServer(bundle.annotations);
            setRevision(bundle.revision);
            revisionRef.current = bundle.revision;
            setStatus(`Task loaded`);
        } finally {
            setHydrating(false);
        }
    }

    async function handleLoadNext() {
        try {
            await loadNext(task?.id ?? null);
        } catch (err) {
            const message = getErrorMessage(err, "Failed to load task");
            if (message.toLowerCase().includes("no available task")) {
                setStatus("No additional tasks available");
                return;
            }
            setStatus(message);
        }
    }

    useEffect(() => {
        loadNext().catch((err) => setStatus(getErrorMessage(err, "Failed to load task")));
        return () => resetStore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const debouncedSave = useMemo(
        () =>
            debounce(async (imageId, expectedRevision, currentItems) => {
                try {
                    setSaving(true);
                    const payload = {
                        expected_revision: expectedRevision,
                        annotations: currentItems.map((item) => ({
                            label: item.label,
                            geometry: item.geometry,
                            source: item.source,
                            status: item.status,
                            confidence: item.confidence,
                        })),
                    };

                    const result = await saveAnnotations(imageId, payload);
                    setRevision(result.revision);
                    revisionRef.current = result.revision;
                    setStatus(`Saved revision ${result.revision}`);
                } catch (err) {
                    const message = getErrorMessage(err, "Save failed");
                    setStatus(`Save failed: ${message}`);

                    if (message.toLowerCase().includes("revision mismatch")) {
                        const latest = await getAnnotations(imageId);
                        skipNextAutosaveRef.current = true;
                        setAnnotationsFromServer(latest.annotations);
                        setRevision(latest.revision);
                        revisionRef.current = latest.revision;
                    }
                } finally {
                    setSaving(false);
                }
            }, 800),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        if (!task || hydrating) {
            return;
        }
        if (skipNextAutosaveRef.current) {
            skipNextAutosaveRef.current = false;
            return;
        }

        debouncedSave(task.image_id, revisionRef.current, annotations);
        return () => debouncedSave.cancel();
    }, [annotations, debouncedSave, hydrating, task]);

    useEffect(() => {
        revisionRef.current = revision;
    }, [revision]);

    useEffect(() => {
        taskRef.current = task;
    }, [task]);

    useEffect(() => {
        if (!projectId || !token) return;

        const source = new EventSource(`${API_URL}/api/v1/events/stream?project_id=${projectId}&token=${encodeURIComponent(token)}`);
        const onAutoLabel = (evt) => {
            try {
                const body = JSON.parse(evt.data);
                const currentTask = taskRef.current;
                if (!currentTask || body.payload?.image_id !== currentTask.image_id) {
                    return;
                }

                if (body.event === "auto_label_completed") {
                    getAnnotations(currentTask.image_id)
                        .then((bundle) => {
                            skipNextAutosaveRef.current = true;
                            setAnnotationsFromServer(bundle.annotations);
                            setRevision(bundle.revision);
                            revisionRef.current = bundle.revision;
                            setStatus(`Auto-label complete`);
                        })
                        .catch(() => undefined);
                }
            } catch {
                // ignore malformed event payloads
            }
        };

        source.addEventListener("auto_label_completed", onAutoLabel);
        source.onerror = () => {
            setStatus("Live updates disconnected; reconnecting...");
        };

        return () => {
            source.removeEventListener("auto_label_completed", onAutoLabel);
            source.close();
        };
    }, [projectId, setAnnotationsFromServer, token]);

    async function onAutoLabel() {
        if (!task) return;

        setStatus("Queueing auto-label...");
        try {
            await triggerAutoLabel(task.image_id);
            setStatus("Auto-label job queued.");
        } catch (err) {
            setStatus(getErrorMessage(err, "Auto-label failed"));
        }
    }

    async function onUpload(e) {
        if (!projectId) return;

        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setUploading(true);
        setStatus(`Uploading ${files.length} image${files.length === 1 ? "" : "s"}...`);

        try {
            let uploadedCount = 0;
            const failures = [];

            for (let i = 0; i < files.length; i += 1) {
                const file = files[i];
                const contentType = file.type || "image/png";
                setStatus(`Uploading ${i + 1}/${files.length}: ${file.name}`);

                try {
                    const dims = await getImageDimensions(file);
                    const presigned = await presignUpload(projectId, file.name, contentType);

                    const putRes = await fetch(presigned.upload_url, {
                        method: "PUT",
                        headers: { "Content-Type": contentType },
                        body: file,
                    });
                    if (!putRes.ok) {
                        throw new Error(`upload failed (${putRes.status})`);
                    }

                    await commitUpload(projectId, {
                        object_key: presigned.object_key,
                        width: dims.width,
                        height: dims.height,
                    });
                    uploadedCount += 1;
                } catch (err) {
                    failures.push({
                        fileName: file.name,
                        message: normalizeUploadError(err),
                    });
                }
            }

            if (uploadedCount > 0) {
                setStatus(`Uploaded ${uploadedCount}/${files.length}. Loading task...`);
                await loadNext();
            }

            if (failures.length > 0) {
                const first = failures[0];
                const moreCount = failures.length - 1;
                const moreText = moreCount > 0 ? ` (+${moreCount} more)` : "";
                setStatus(
                    uploadedCount > 0
                        ? `Uploaded ${uploadedCount}/${files.length} images. Failed: ${first.fileName} (${first.message})${moreText}`
                        : `Upload failed: ${first.fileName} (${first.message})${moreText}`,
                );
            } else if (uploadedCount > 0) {
                setStatus(`Uploaded ${uploadedCount} image${uploadedCount === 1 ? "" : "s"} successfully.`);
            }
        } catch (err) {
            setStatus(normalizeUploadError(err));
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    function logout() {
        clearAuth();
        navigate("/login");
    }

    return (
        <div className="flex flex-col h-screen max-h-screen bg-canvas overflow-hidden">
            {/* Top Toolbar */}
            <header className="h-16 flex-shrink-0 border-b border-border/50 bg-surface/90 backdrop-blur-md px-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Link to="/projects" className="text-gray-400 hover:text-white transition-colors">
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

                    <div className="flex items-center gap-3 ml-4 bg-black/30 rounded-full px-3 py-1 border border-white/5">
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{status}</span>
                        {saving && <span className="text-xs text-warning font-mono ml-2">Autosaving...</span>}
                    </div>
                </div>

                <div className="flex flex-1 justify-center px-4">
                    <ToolPalette />
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-4 mr-4 text-xs font-mono text-gray-500">
                        <span className="flex gap-1.5 items-center">
                            TOT: <strong className="text-white">{annotations.length}</strong>
                        </span>
                        <span className="flex gap-1.5 items-center">
                            MAN: <strong className="text-white">{manualCount}</strong>
                        </span>
                        <span className="flex gap-1.5 items-center text-primary">
                            <Cpu className="w-3 h-3" /> AUTO: <strong className="text-primary">{autoCount}</strong>
                        </span>
                        <Badge variant="outline" className="border-border">REV {revision}</Badge>
                    </div>

                    <Button variant="ghost" size="icon" onClick={logout} className="text-gray-400 hover:text-danger">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Main Action Bar */}
            <div className="h-12 flex-shrink-0 border-b border-border/30 bg-black/40 px-4 flex items-center justify-between z-10">
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
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-gray-400">
                        <Link to={`/projects/${projectId}/exports`}><Download className="w-3.5 h-3.5 mr-2" /> Exports</Link>
                    </Button>
                </div>
            </div>

            {/* Canvas & Sidebar Workspace */}
            <div className="flex-1 flex min-h-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]">
                {/* Main Canvas Area */}
                <div className="flex-1 relative flex overflow-hidden">
                    {!task?.image ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center m-8 border-2 border-dashed border-white/5 rounded-2xl bg-black/50 backdrop-blur-sm">
                            <MonitorPlay className="w-16 h-16 text-gray-800 mb-6" />
                            <h3 className="text-xl font-medium text-white mb-2">Matrix Offline</h3>
                            <p className="text-gray-500 text-center max-w-sm">Ingest media or load a chunk to initialize the annotation canvas.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            style={{ cursor: "crosshair" }}
                        >
                            <CanvasStage imageUrl={task.image.download_url || ""} imageWidth={task.image.width} imageHeight={task.image.height} />
                        </motion.div>
                    )}
                </div>

                {/* Right Metadata / Objects Sidebar */}
                <motion.div
                    initial={{ x: 300 }}
                    animate={{ x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-80 flex-shrink-0 border-l border-border/50 bg-surface/80 backdrop-blur-xl flex flex-col shadow-2xl z-20"
                >
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
