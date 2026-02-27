import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createExport, listExports } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";

function exportStatusBadge(status) {
    if (status === "completed") return "badge badge-success";
    if (status === "failed") return "badge badge-danger";
    return "badge badge-warning";
}

export function ExportsPage() {
    const navigate = useNavigate();
    const { projectId = "" } = useParams();
    const clearAuth = useAuthStore((s) => s.clear);

    const [jobs, setJobs] = useState([]);
    const [status, setStatus] = useState("Ready");
    const [busy, setBusy] = useState(false);

    const completedCount = jobs.filter((job) => job.status === "completed").length;
    const failedCount = jobs.filter((job) => job.status === "failed").length;
    const activeCount = jobs.filter((job) => job.status !== "completed" && job.status !== "failed").length;

    async function load() {
        const data = await listExports(projectId);
        setJobs(data);
    }

    useEffect(() => {
        load().catch((err) => setStatus(getErrorMessage(err, "Failed loading exports")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    async function trigger(format) {
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
    }

    function logout() {
        clearAuth();
        navigate("/login");
    }

    return (
        <main className="page">
            <header className="page-header card">
                <div className="header-main">
                    <p className="page-kicker">Delivery</p>
                    <h1 className="page-title">Dataset Exports</h1>
                    <div className="actions">
                        <p className="status-pill">{status}</p>
                    </div>
                    <div className="metric-grid">
                        <div className="metric-tile">
                            <strong>{completedCount}</strong>
                            <span>Completed</span>
                        </div>
                        <div className="metric-tile">
                            <strong>{activeCount}</strong>
                            <span>Active</span>
                        </div>
                        <div className="metric-tile">
                            <strong>{failedCount}</strong>
                            <span>Failed</span>
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
                        <Link className="link-chip" to={`/projects/${projectId}/review`}>
                            Review
                        </Link>
                    </div>
                    <button className="secondary" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <section className="card toolbar">
                <div className="toolbar-group">
                    <button disabled={busy} onClick={() => trigger("coco")}>
                        Export COCO
                    </button>
                    <button disabled={busy} onClick={() => trigger("yolo")}>
                        Export YOLO
                    </button>
                </div>
                <div className="toolbar-group">
                    <button className="secondary" disabled={busy} onClick={load}>
                        Refresh
                    </button>
                </div>
            </section>

            <section className="card">
                <h2 className="card-title">Export Jobs</h2>
                <p className="card-subtitle">Track archive generation and download ready artifacts.</p>
                <ul className="list">
                    {jobs.map((job) => (
                        <li key={job.id}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                                    <strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                                        {job.format.toUpperCase()}
                                    </strong>
                                    <span className={exportStatusBadge(job.status)}>{job.status}</span>
                                </div>
                                <div className="muted small" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem" }}>
                                    {new Date(job.created_at).toLocaleString()}
                                </div>
                                {job.error_text && <div className="error" style={{ marginTop: "0.3rem" }}>{job.error_text}</div>}
                            </div>
                            <div className="actions">
                                {job.download_url ? (
                                    <a className="link-chip" href={job.download_url} target="_blank" rel="noreferrer">
                                        Download
                                    </a>
                                ) : (
                                    <span className="muted small">No artifact yet</span>
                                )}
                            </div>
                        </li>
                    ))}
                    {jobs.length === 0 && (
                        <li>
                            <div className="empty-state" style={{ width: "100%" }}>No export jobs yet. Start with COCO or YOLO export.</div>
                        </li>
                    )}
                </ul>
            </section>
        </main>
    );
}
