import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    getAnnotations,
    nextTask,
    saveAnnotations,
    triggerAutoLabel,
} from "../api";
import { API_URL } from "../api/client";
import { useAnnotationStore } from "../store/annotationStore";
import { getErrorMessage } from "../utils/error";

/**
 * Manages the annotation task lifecycle: loading, autosaving,
 * SSE live-updates, and auto-label triggering.
 */
export const useAnnotationTask = (projectId) => {
    const annotations = useAnnotationStore((s) => s.annotations);
    const setAnnotationsFromServer = useAnnotationStore((s) => s.setAnnotationsFromServer);
    const resetStore = useAnnotationStore((s) => s.reset);

    const [task, setTask] = useState(null);
    const [revision, setRevision] = useState(0);
    const [hydrating, setHydrating] = useState(false);
    const [status, setStatus] = useState("Ready");
    const [saving, setSaving] = useState(false);

    const revisionRef = useRef(0);
    const skipNextAutosaveRef = useRef(true);
    const taskRef = useRef(null);

    const loadNext = async (excludeTaskId = null) => {
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
            setStatus("Task loaded");
        } finally {
            setHydrating(false);
        }
    };

    const handleLoadNext = async () => {
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
    };

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
        if (!task || hydrating) return;
        if (skipNextAutosaveRef.current) {
            skipNextAutosaveRef.current = false;
            return;
        }
        debouncedSave(task.image_id, revisionRef.current, annotations);
        return () => debouncedSave.cancel();
    }, [annotations, debouncedSave, hydrating, task]);

    useEffect(() => { revisionRef.current = revision; }, [revision]);
    useEffect(() => { taskRef.current = task; }, [task]);

    useEffect(() => {
        if (!projectId) return;

        const source = new EventSource(
            `${API_URL}/api/v1/events/stream?project_id=${encodeURIComponent(projectId)}`,
            { withCredentials: true },
        );

        const onAutoLabelEvent = (evt) => {
            try {
                const body = JSON.parse(evt.data);
                const currentTask = taskRef.current;
                if (!currentTask || body.payload?.image_id !== currentTask.image_id) return;

                if (body.event === "auto_label_completed") {
                    getAnnotations(currentTask.image_id)
                        .then((bundle) => {
                            skipNextAutosaveRef.current = true;
                            setAnnotationsFromServer(bundle.annotations);
                            setRevision(bundle.revision);
                            revisionRef.current = bundle.revision;
                            setStatus("Auto-label complete");
                        })
                        .catch(() => undefined);
                }
            } catch {
                // Ignore malformed payloads.
            }
        };

        source.addEventListener("auto_label_completed", onAutoLabelEvent);
        source.onerror = () => setStatus("Live updates disconnected; reconnecting...");

        return () => {
            source.removeEventListener("auto_label_completed", onAutoLabelEvent);
            source.close();
        };
    }, [projectId, setAnnotationsFromServer]);

    const onAutoLabel = async () => {
        if (!task) return;
        setStatus("Queueing auto-label...");
        try {
            await triggerAutoLabel(task.image_id);
            setStatus("Auto-label job queued.");
        } catch (err) {
            setStatus(getErrorMessage(err, "Auto-label failed"));
        }
    };

    return {
        task,
        revision,
        status,
        saving,
        handleLoadNext,
        loadNext,
        onAutoLabel,
        setStatus,
    };
};
