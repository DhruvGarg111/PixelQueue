import { useCallback, useEffect, useState } from "react";
import { createProject, deleteProject, getMe, listProjects } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";

/**
 * Manages the project list: loading, creating, and deleting projects.
 */
export const useProjectList = () => {
    const setMe = useAuthStore((s) => s.setMe);

    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const isErrorStatus = status ? /fail|error/i.test(status) : false;

    // ⚡ Bolt Optimization: Stabilize load, onCreate, and onDelete with useCallback
    // to prevent breaking React.memo on child components like ProjectCard when parent re-renders.
    const load = useCallback(async () => {
        const [meData, projectData] = await Promise.all([getMe(), listProjects()]);
        setMe(meData);
        setProjects(projectData);
    }, [setMe]);

    useEffect(() => {
        load().catch((err) => setStatus(getErrorMessage(err, "Load failed")));
    }, [load]);

    const onCreate = useCallback(async (name, description) => {
        setLoading(true);
        setStatus(null);
        try {
            await createProject(name, description);
            await load();
            setStatus("Project created");
        } catch (err) {
            setStatus(getErrorMessage(err, "Create failed"));
        } finally {
            setLoading(false);
        }
    }, [load]);

    const onDelete = useCallback(async (projectId) => {
        if (!window.confirm("Are you sure you want to delete this queue? This action cannot be undone.")) return;
        setLoading(true);
        setStatus(null);
        try {
            await deleteProject(projectId);
            await load();
            setStatus("Queue terminated");
        } catch (err) {
            setStatus(getErrorMessage(err, "Delete failed"));
        } finally {
            setLoading(false);
        }
    }, [load]);

    return {
        projects,
        status,
        loading,
        isErrorStatus,
        onCreate,
        onDelete,
    };
};
