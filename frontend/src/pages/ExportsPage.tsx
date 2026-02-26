import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createExport, listExports } from "../api";
import { useAuthStore } from "../store/authStore";
import type { ExportJob, ExportFormat } from "../types/domain";

export function ExportsPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const clearAuth = useAuthStore((s) => s.clear);
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await listExports(projectId);
    setJobs(data);
  }

  useEffect(() => {
    load().catch((err) => setStatus(err instanceof Error ? err.message : "Failed loading exports"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function trigger(format: ExportFormat) {
    setBusy(true);
    try {
      await createExport(projectId, format);
      setStatus(`${format.toUpperCase()} export queued`);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Export failed");
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
        <div>
          <p className="page-kicker">Delivery</p>
          <h1 className="page-title">Dataset Exports</h1>
          <p className="status-pill">{status}</p>
        </div>
        <div className="actions">
          <Link to="/projects">Projects</Link>
          <Link to={`/projects/${projectId}/annotate`}>Annotate</Link>
          <Link to={`/projects/${projectId}/review`}>Review</Link>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="card toolbar">
        <button disabled={busy} onClick={() => trigger("coco")}>
          Export COCO
        </button>
        <button disabled={busy} onClick={() => trigger("yolo")}>
          Export YOLO
        </button>
        <button disabled={busy} onClick={load}>
          Refresh
        </button>
      </section>

      <section className="card">
        <h2 className="card-title">Export Jobs</h2>
        <ul className="list">
          {jobs.map((job) => (
            <li key={job.id}>
              <div>
                <strong>{job.format.toUpperCase()}</strong> <span className="badge">{job.status}</span>
                <div className="muted">{new Date(job.created_at).toLocaleString()}</div>
                {job.error_text && <div className="error">{job.error_text}</div>}
              </div>
              <div className="actions">
                {job.download_url ? (
                  <a href={job.download_url} target="_blank" rel="noreferrer">
                    Download
                  </a>
                ) : (
                  <span className="muted">No artifact yet</span>
                )}
              </div>
            </li>
          ))}
          {jobs.length === 0 && <li>No export jobs yet.</li>}
        </ul>
      </section>
    </main>
  );
}
