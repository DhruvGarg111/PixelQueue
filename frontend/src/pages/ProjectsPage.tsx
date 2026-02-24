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
        <div>
          <h1>Projects</h1>
          <p>
            Signed in as {me?.full_name || "unknown"} ({me?.global_role || "unknown"})
          </p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="two-col">
        <form className="card" onSubmit={onCreate}>
          <h2>Create Project</h2>
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
        </form>

        <div className="card">
          <h2>My Projects</h2>
          {status && <p>{status}</p>}
          <ul className="list">
            {projects.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  <div className="muted">Role: {p.my_role || "n/a"}</div>
                </div>
                <div className="actions">
                  <Link to={`/projects/${p.id}/annotate`}>Annotate</Link>
                  <Link to={`/projects/${p.id}/review`}>Review</Link>
                  <Link to={`/projects/${p.id}/exports`}>Exports</Link>
                </div>
              </li>
            ))}
            {projects.length === 0 && <li>No projects yet.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}

