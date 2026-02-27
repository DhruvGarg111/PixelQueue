import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

async function getImageDimensions(file) {
    const bitmap = await createImageBitmap(file);
    return { width: bitmap.width, height: bitmap.height };
}

export function AnnotatePage() {
    const navigate = useNavigate();
    const { projectId = "" } = useParams();
    const token = useAuthStore((s) => s.accessToken);
    const clearAuth = useAuthStore((s) => s.clear);
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
    const manualCount = annotations.filter((item) => item.source === "manual").length;
    const autoCount = annotations.filter((item) => item.source !== "manual").length;

    async function loadNext() {
        setStatus("Loading next task...");
        const next = await nextTask(projectId);
        setTask(next);
        setHydrating(true);
        skipNextAutosaveRef.current = true;
        const bundle = await getAnnotations(next.image_id);
        setAnnotationsFromServer(bundle.annotations);
        setRevision(bundle.revision);
        revisionRef.current = bundle.revision;
        setHydrating(false);
        setStatus(`Task loaded: ${next.id}`);
    }

    useEffect(() => {
        loadNext().catch((err) => setStatus(err instanceof Error ? err.message : "Failed to load task"));
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
                    const message = err instanceof Error ? err.message : "save failed";
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

    const taskRef = useRef(null);
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
                            setStatus(`Auto-label completed (${bundle.annotations.length} annotations loaded)`);
                        })
                        .catch(() => undefined);
                }
            } catch {
                // ignore
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
            setStatus(err instanceof Error ? err.message : "Auto-label failed");
        }
    }

    async function onUpload(e) {
        if (!projectId) return;
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setStatus("Uploading image...");
        try {
            const dims = await getImageDimensions(file);
            const presigned = await presignUpload(projectId, file.name, file.type || "image/png");
            const putRes = await fetch(presigned.upload_url, {
                method: "PUT",
                headers: { "Content-Type": file.type || "application/octet-stream" },
                body: file,
            });
            if (!putRes.ok) {
                throw new Error(`upload failed (${putRes.status})`);
            }
            await commitUpload(projectId, { object_key: presigned.object_key, width: dims.width, height: dims.height });
            setStatus("Upload committed. Loading task...");
            await loadNext();
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Upload failed");
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
        <main className="page">
            <header className="page-header card">
                <div className="header-main">
                    <p className="page-kicker">Labeling</p>
                    <h1 className="page-title">Annotation Workspace</h1>
                    <div className="actions">
                        <p className="status-pill">{status}</p>
                        {saving && <span className="status-pill">Autosaving…</span>}
                    </div>
                    <div className="metric-grid">
                        <div className="metric-tile">
                            <strong>{task ? task.id.slice(0, 8) : "—"}</strong>
                            <span>Task</span>
                        </div>
                        <div className="metric-tile">
                            <strong>{annotations.length}</strong>
                            <span>Annotations</span>
                        </div>
                        <div className="metric-tile">
                            <strong>
                                {manualCount}
                                <span style={{ opacity: 0.4, margin: "0 2px" }}>/</span>
                                {autoCount}
                            </strong>
                            <span>Manual / Auto</span>
                        </div>
                    </div>
                </div>
                <div className="top-actions">
                    <div className="quick-links">
                        <Link className="link-chip" to="/projects">
                            Projects
                        </Link>
                        <Link className="link-chip" to={`/projects/${projectId}/review`}>
                            Review
                        </Link>
                        <Link className="link-chip" to={`/projects/${projectId}/exports`}>
                            Exports
                        </Link>
                    </div>
                    <button className="secondary" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <section className="card toolbar">
                <div className="toolbar-group">
                    <ToolPalette />
                </div>
                <div className="toolbar-group">
                    <button onClick={loadNext}>Load Next Task</button>
                    <button onClick={onAutoLabel} disabled={!task}>
                        ✦ Auto-Label
                    </button>
                    <label className="upload-btn">
                        {uploading ? "Uploading…" : "↑ Upload Image"}
                        <input type="file" accept="image/*" onChange={onUpload} hidden />
                    </label>
                </div>
                <div className="toolbar-group">
                    <span className="status-pill">Rev {revision}</span>
                </div>
            </section>

            {!task?.image && (
                <section className="card">
                    <div className="empty-state">No task image loaded yet. Upload an image or load the next task.</div>
                </section>
            )}

            {task?.image && (
                <section className="annotate-layout">
                    <div className="card canvas-panel">
                        <CanvasStage imageUrl={task.image.download_url || ""} imageWidth={task.image.width} imageHeight={task.image.height} />
                    </div>
                    <AnnotationSidebar />
                </section>
            )}
        </main>
    );
}
