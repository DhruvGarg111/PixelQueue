import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProject, getMe, listProjects } from "../api";
import { useAuthStore } from "../store/authStore";
import type { Project } from "../types/domain";

export function ProjectsPage() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const me = useAuthStore((s) => s.me);
  const setMe = useAuthStore((s) => s.setMe);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("Sample Annotation Project");
  const [description, setDescription] = useState("Project seeded from frontend");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isErrorStatus = status ? /fail|error/i.test(status) : false;

  async function load() {
    const [meData, projectData] = await Promise.all([getMe(), listProjects()]);
    setMe(meData);
    setProjects(projectData);
  }

  useEffect(() => {
    load().catch((err) => setStatus(err instanceof Error ? err.message : "Load failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await createProject(name, description);
      await load();
      setStatus("Project created");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clear();
    navigate("/login");
  }

  return (
    <main className="page">
      <header className="page-header card">
        <div className="header-main">
          <p className="page-kicker">Projects</p>
          <h1 className="page-title">Project Control Deck</h1>
          <p className="muted">
            Signed in as {me?.full_name || "unknown"} ({me?.global_role || "unknown"})
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
          <p className="card-subtitle">Launch a labeling stream and route annotations into review.</p>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create"}
          </button>
          {status && isErrorStatus && <p className="error">{status}</p>}
        </form>

        <div className="card">
          <h2 className="card-title">My Projects</h2>
          <p className="card-subtitle">Jump directly into annotation, review, or dataset export workflows.</p>
          <ul className="list project-grid">
            {projects.map((p) => (
              <li key={p.id}>
                <div className="project-row">
                  <div className="project-title">
                    <strong>{p.name}</strong>
                    <div className="muted small">{p.id.slice(0, 8)}</div>
                    <div className="muted">Role: {p.my_role || "n/a"}</div>
                  </div>
                  <div className="project-links">
                    <Link to={`/projects/${p.id}/annotate`}>Annotate</Link>
                    <Link to={`/projects/${p.id}/review`}>Review</Link>
                    <Link to={`/projects/${p.id}/exports`}>Exports</Link>
                  </div>
                </div>
              </li>
            ))}
            {projects.length === 0 && (
              <li>
                <div className="empty-state">No projects yet. Create one to begin annotation.</div>
              </li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
