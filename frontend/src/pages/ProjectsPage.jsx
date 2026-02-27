import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProject, deleteProject, getMe, listProjects } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";

export function ProjectsPage() {
    const navigate = useNavigate();
    const clear = useAuthStore((s) => s.clear);
    const me = useAuthStore((s) => s.me);
    const setMe = useAuthStore((s) => s.setMe);
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("Sample Annotation Project");
    const [description, setDescription] = useState("Project seeded from frontend");
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const isErrorStatus = status ? /fail|error/i.test(status) : false;

    async function load() {
        const [meData, projectData] = await Promise.all([getMe(), listProjects()]);
        setMe(meData);
        setProjects(projectData);
    }

    useEffect(() => {
        load().catch((err) => setStatus(getErrorMessage(err, "Load failed")));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onCreate(e) {
        e.preventDefault();
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
    }

    function logout() {
        clear();
        navigate("/login");
    }

    async function onDelete(projectId) {
        if (!window.confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
        setLoading(true);
        setStatus(null);
        try {
            await deleteProject(projectId);
            await load();
            setStatus("Project deleted");
        } catch (err) {
            setStatus(getErrorMessage(err, "Delete failed"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page">
            <header className="page-header card">
                <div className="header-main">
                    <p className="page-kicker">Projects</p>
                    <h1 className="page-title">Project Workspace</h1>
                    <p className="muted small">
                        Signed in as <strong style={{ color: "var(--text-primary)" }}>{me?.full_name || "unknown"}</strong>{" "}
                        <span className="badge" style={{ marginLeft: "0.3rem" }}>{me?.global_role || "unknown"}</span>
                    </p>
                    <div className="metric-grid">
                        <div className="metric-tile">
                            <strong>{projects.length}</strong>
                            <span>Projects</span>
                        </div>
                        <div className="metric-tile">
                            <strong>{me?.global_role || "n/a"}</strong>
                            <span>Access Role</span>
                        </div>
                        <div className="metric-tile">
                            <strong>{projects.filter((p) => p.my_role === "manager").length}</strong>
                            <span>Manager Scope</span>
                        </div>
                    </div>
                </div>
                <div className="top-actions">
                    {status && !isErrorStatus && <p className="status-pill">{status}</p>}
                    <button className="secondary" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <section className="two-col">
                <form className="card form-grid" onSubmit={onCreate}>
                    <h2 className="card-title">Create Project</h2>
                    <p className="card-subtitle">Create a project and start assigning annotation tasks.</p>
                    <label>
                        Name
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project name"
                        />
                    </label>
                    <label>
                        Description
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the project"
                        />
                    </label>
                    <button disabled={loading} type="submit">
                        {loading ? "Creating..." : "Create Project"}
                    </button>
                    {status && isErrorStatus && <p className="error">{status}</p>}
                </form>

                <div className="card">
                    <h2 className="card-title">My Projects</h2>
                    <p className="card-subtitle">Open annotation, review, or export for any project.</p>
                    <ul className="list project-grid">
                        {projects.map((p) => (
                            <li key={p.id}>
                                <div className="project-row">
                                    <div className="project-title">
                                        <strong>{p.name}</strong>
                                        <div className="muted small" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem" }}>
                                            {p.id.slice(0, 8)}
                                        </div>
                                        <div>
                                            <span className="badge" style={{ marginTop: "0.15rem" }}>{p.my_role || "n/a"}</span>
                                        </div>
                                    </div>
                                    <div className="project-links">
                                        <Link to={`/projects/${p.id}/annotate`}>Annotate</Link>
                                        <Link to={`/projects/${p.id}/review`}>Review</Link>
                                        <Link to={`/projects/${p.id}/exports`}>Exports</Link>
                                        {me?.global_role === "admin" && (
                                            <button
                                                className="danger ghost"
                                                onClick={(e) => { e.preventDefault(); onDelete(p.id); }}
                                                style={{ padding: "0.26rem 0.5rem", marginLeft: "0.25rem", border: "1px solid rgba(248, 113, 113, 0.3)" }}
                                                title="Delete Project"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                        {projects.length === 0 && (
                            <li>
                                <div className="empty-state" style={{ width: "100%" }}>No projects yet. Create one to get started.</div>
                            </li>
                        )}
                    </ul>
                </div>
            </section>
        </main>
    );
}
