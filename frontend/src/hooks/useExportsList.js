import { useEffect, useState } from "react";
import { createExport, listExports } from "../api";
import { getErrorMessage } from "../utils/error";

/**
 * Manages the exports list: loading, polling active jobs,
 * and triggering new export pipelines.
 */
export const useExportsList = (projectId) => {
    const [jobs, setJobs] = useState([]);
    const [status, setStatus] = useState("Ready");
    const [busy, setBusy] = useState(false);

    const completedCount = jobs.filter((j) => j.status === "completed").length;
    const failedCount = jobs.filter((j) => j.status === "failed").length;
    const activeCount = jobs.filter((j) => j.status !== "completed" && j.status !== "failed").length;

    const load = async () => {
        const data = await listExports(projectId);
        setJobs(data);
    };

    // Initial load
    useEffect(() => {
        load().catch((err) => setStatus(getErrorMessage(err, "Failed loading exports")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // Poll while jobs are active
    useEffect(() => {
        if (activeCount === 0) return;
        const interval = setInterval(() => load().catch(() => { }), 3000);
        return () => clearInterval(interval);
    }, [activeCount, projectId]);

    const trigger = async (format) => {
        setBusy(true);
        try {
            await createExport(projectId, format);
            setStatus(`${format.toUpperCase()} export queued`);
            await load();
        } catch (err) {
            setStatus(getErrorMessage(err, "Export failed"));
        } finally {
            setBusy(false);
        }
    };

    return {
        jobs,
        status,
        busy,
        completedCount,
        failedCount,
        activeCount,
        load,
        trigger,
    };
};
