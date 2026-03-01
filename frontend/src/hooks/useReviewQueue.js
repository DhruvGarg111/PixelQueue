import { useEffect, useState } from "react";
import { getAnnotations, listTasks, reviewAnnotation } from "../api";
import { getErrorMessage } from "../utils/error";

/**
 * Manages the review queue: loading tasks, selecting, reviewing
 * individual annotations, and bulk approve/reject operations.
 */
export const useReviewQueue = (projectId) => {
    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [bundle, setBundle] = useState(null);
    const [status, setStatus] = useState("Ready");
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const approvedCount = bundle ? bundle.annotations.filter((a) => a.status === "approved").length : 0;
    const rejectedCount = bundle ? bundle.annotations.filter((a) => a.status === "rejected").length : 0;
    const pendingCount = bundle ? bundle.annotations.filter((a) => a.status !== "approved").length : 0;

    const loadTasks = async () => {
        const rows = await listTasks(projectId, "in_review");
        setTasks(rows);
        if (!selectedTaskId && rows.length > 0) {
            setSelectedTaskId(rows[0].id);
        }
    };

    // Initial load
    useEffect(() => {
        loadTasks().catch((err) => setStatus(getErrorMessage(err, "Failed loading tasks")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // Load annotations when task selection changes
    useEffect(() => {
        if (!selectedTaskId) return;
        const task = tasks.find((t) => t.id === selectedTaskId);
        if (!task) {
            if (!bundle) setSelectedTaskId(tasks.length > 0 ? tasks[0].id : null);
            return;
        }
        if (!bundle || bundle.image_id !== task.image_id) {
            getAnnotations(task.image_id)
                .then((next) => setBundle(next))
                .catch((err) => setStatus(getErrorMessage(err, "Failed loading annotations")));
        }
    }, [selectedTaskId, tasks]);

    const review = async (id, action) => {
        try {
            await reviewAnnotation(id, action);
            const nextStatus = action === "approve" ? "approved" : "rejected";
            setStatus(`Annotation ${nextStatus}`);

            setBundle((current) =>
                current
                    ? { ...current, annotations: current.annotations.map((a) => (a.id === id ? { ...a, status: nextStatus } : a)) }
                    : current,
            );

            if (!bundle) return;
            const fresh = await getAnnotations(bundle.image_id);
            setBundle(fresh);
            await loadTasks();
        } catch (err) {
            setStatus(getErrorMessage(err, "Review failed"));
        }
    };

    const bulkReview = async (action) => {
        if (!bundle) return;
        const targetStatus = action === "approve" ? "approved" : "rejected";
        const candidates = bundle.annotations.filter((a) => a.status !== targetStatus);
        if (candidates.length === 0) {
            setStatus(`All annotations are already ${targetStatus}`);
            return;
        }

        setBulkProcessing(true);
        const verb = action === "approve" ? "Approving" : "Rejecting";
        setStatus(`${verb} ${candidates.length} annotations...`);

        try {
            const results = await Promise.allSettled(candidates.map((a) => reviewAnnotation(a.id, action)));
            const succeeded = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.length - succeeded;

            const fresh = await getAnnotations(bundle.image_id);
            setBundle(fresh);
            await loadTasks();

            const pastVerb = action === "approve" ? "Approved" : "Rejected";
            setStatus(failed === 0
                ? `${pastVerb} ${succeeded} annotation${succeeded === 1 ? "" : "s"}`
                : `${pastVerb} ${succeeded}, failed ${failed}`
            );
        } catch (err) {
            setStatus(getErrorMessage(err, `${verb} all failed`));
        } finally {
            setBulkProcessing(false);
        }
    };

    return {
        tasks,
        selectedTaskId,
        setSelectedTaskId,
        bundle,
        status,
        bulkProcessing,
        approvedCount,
        rejectedCount,
        pendingCount,
        review,
        approveAll: () => bulkReview("approve"),
        rejectAll: () => bulkReview("reject"),
    };
};
