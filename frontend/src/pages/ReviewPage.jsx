import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAnnotations, listTasks, reviewAnnotation } from "../api";
import { useAuthStore } from "../store/authStore";

export function ReviewPage() {
    const navigate = useNavigate();
    const { projectId = "" } = useParams();
    const clearAuth = useAuthStore((s) => s.clear);
    const [tasks, setTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [bundle, setBundle] = useState(null);
    const [status, setStatus] = useState("Ready");
    const [bulkApproving, setBulkApproving] = useState(false);
    const approvedCount = bundle ? bundle.annotations.filter((ann) => ann.status === "approved").length : 0;
    const rejectedCount = bundle ? bundle.annotations.filter((ann) => ann.status === "rejected").length : 0;
    const pendingApprovalCount = bundle ? bundle.annotations.filter((ann) => ann.status !== "approved").length : 0;

    async function loadTasks() {
        const taskRows = await listTasks(projectId, "in_review");
        setTasks(taskRows);
        if (!selectedTaskId && taskRows.length > 0) {
            setSelectedTaskId(taskRows[0].id);
        }
    }

    useEffect(() => {
        loadTasks().catch((err) => setStatus(err instanceof Error ? err.message : "Failed loading tasks"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    useEffect(() => {
        if (!selectedTaskId) return;
        const task = tasks.find((t) => t.id === selectedTaskId);
        if (!task) {
            setBundle(null);
            setSelectedTaskId(tasks.length > 0 ? tasks[0].id : null);
            return;
        }
        getAnnotations(task.image_id)
            .then((b) => setBundle(b))
            .catch((err) => setStatus(err instanceof Error ? err.message : "Failed loading annotations"));
    }, [selectedTaskId, tasks]);

    async function review(id, action) {
        try {
            await reviewAnnotation(id, action);
            setStatus(`Annotation ${action}d`);
            if (!bundle) return;
            const fresh = await getAnnotations(bundle.image_id);
            setBundle(fresh);
            await loadTasks();
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Review failed");
        }
    }

    async function approveAll() {
        if (!bundle) return;
        const candidates = bundle.annotations.filter((ann) => ann.status !== "approved");
        if (candidates.length === 0) {
            setStatus("All annotations are already approved");
            return;
        }

        setBulkApproving(true);
        setStatus(`Approving ${candidates.length} annotations...`);
        try {
            const results = await Promise.allSettled(candidates.map((ann) => reviewAnnotation(ann.id, "approve")));
            const approvedNow = results.filter((result) => result.status === "fulfilled").length;
            const failed = results.length - approvedNow;

            const fresh = await getAnnotations(bundle.image_id);
            setBundle(fresh);
            await loadTasks();

            if (failed === 0) {
                setStatus(`Approved ${approvedNow} annotation${approvedNow === 1 ? "" : "s"}`);
            } else {
                setStatus(`Approved ${approvedNow}, failed ${failed}`);
            }
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Approve all failed");
        } finally {
            setBulkApproving(false);
        }
    }

    function logout() {
        clearAuth();
        navigate("/login");
    }

    function statusBadgeClass(s) {
        if (s === "approved") return "badge badge-success";
        if (s === "rejected") return "badge badge-danger";
        return "badge badge-warning";
    }

    return (
        <main className="page">
            <header className="page-header card">
                <div className="header-main">
                    <p className="page-kicker">Quality Control</p>
                    <h1 className="page-title">Review Queue</h1>
                    <div className="actions">
                        <p className="status-pill">{status}</p>
                    </div>
                    <div className="metric-grid">
                        <div className="metric-tile">
                            <strong>{tasks.length}</strong>
                            <span>Tasks In Review</span>
                        </div>
                        <div className="metric-tile">
                            <strong>{approvedCount}</strong>
                            <span>Approved</span>
                        </div>
                        <div className="metric-tile">
                            <strong>{rejectedCount}</strong>
                            <span>Rejected</span>
                        </div>
                    </div>
                </div>
                <div className="top-actions">
                    <div className="quick-links">
                        <Link className="link-chip" to="/projects">
                            Projects
                        </Link>
                        <Link className="link-chip" to={`/projects/${projectId}/annotate`}>
                            Annotate
                        </Link>
                    </div>
                    <button className="secondary" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <section className="two-col">
                <div className="card">
                    <h2 className="card-title">Tasks In Review</h2>
                    <p className="card-subtitle">Select a task to validate generated or manual annotations.</p>
                    <ul className="list">
                        {tasks.map((task) => (
                            <li key={task.id} className={selectedTaskId === task.id ? "active-row" : ""}>
                                <button type="button" className="task-select" onClick={() => setSelectedTaskId(task.id)}>
                                    <div>
                                        <strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem" }}>
                                            {task.id.slice(0, 8)}
                                        </strong>
                                        <div className="muted small" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem" }}>
                                            img:{task.image_id.slice(0, 8)}
                                        </div>
                                    </div>
                                    <span className="badge">{task.status}</span>
                                </button>
                            </li>
                        ))}
                        {tasks.length === 0 && (
                            <li>
                                <div className="empty-state" style={{ width: "100%" }}>No tasks currently in review.</div>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="card">
                    <h2 className="card-title">Annotations</h2>
                    <p className="card-subtitle">Approve or reject each annotation to complete QA.</p>
                    <div className="actions" style={{ marginBottom: "0.5rem" }}>
                        <button type="button" onClick={approveAll} disabled={!bundle || pendingApprovalCount === 0 || bulkApproving}>
                            {bulkApproving ? "Approving…" : "✓ Approve All"}
                        </button>
                    </div>
                    {!bundle && <div className="empty-state">Select a task to review annotations.</div>}
                    {bundle && (
                        <div className="annotation-list">
                            {bundle.annotations.map((ann) => (
                                <div key={ann.id} className="annotation-item">
                                    <div className="annotation-row">
                                        <strong>{ann.label}</strong>
                                        <span className={statusBadgeClass(ann.status)}>{ann.status}</span>
                                    </div>
                                    <div className="annotation-meta muted small">
                                        <span>{ann.source}</span>
                                        <span>{ann.geometry.type}</span>
                                        {ann.confidence !== null && ann.confidence !== undefined ? <span>conf {ann.confidence.toFixed(2)}</span> : null}
                                    </div>
                                    <div className="actions">
                                        <button disabled={bulkApproving} onClick={() => review(ann.id, "approve")}>
                                            ✓ Approve
                                        </button>
                                        <button className="danger" disabled={bulkApproving} onClick={() => review(ann.id, "reject")}>
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {bundle.annotations.length === 0 && <div className="empty-state">No annotations for selected task.</div>}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
