import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAnnotations, listTasks, reviewAnnotation } from "../api";
import { useAuthStore } from "../store/authStore";
import type { AnnotationBundle, TaskInfo } from "../types/domain";

export function ReviewPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const clearAuth = useAuthStore((s) => s.clear);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<AnnotationBundle | null>(null);
  const [status, setStatus] = useState("Ready");

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
    if (!task) return;
    getAnnotations(task.image_id)
      .then((b) => setBundle(b))
      .catch((err) => setStatus(err instanceof Error ? err.message : "Failed loading annotations"));
  }, [selectedTaskId, tasks]);

  async function review(id: string, action: "approve" | "reject") {
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

  function logout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <main className="page">
      <header className="page-header card">
        <div>
          <h1>Review Queue</h1>
          <p>{status}</p>
        </div>
        <div className="actions">
          <Link to="/projects">Projects</Link>
          <Link to={`/projects/${projectId}/annotate`}>Annotate</Link>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="two-col">
        <div className="card">
          <h2>Tasks In Review</h2>
          <ul className="list">
            {tasks.map((task) => (
              <li key={task.id} className={selectedTaskId === task.id ? "active-row" : ""} onClick={() => setSelectedTaskId(task.id)}>
                <div>
                  <strong>{task.id.slice(0, 8)}</strong>
                  <div className="muted">Image: {task.image_id.slice(0, 8)}</div>
                </div>
                <span className="badge">{task.status}</span>
              </li>
            ))}
            {tasks.length === 0 && <li>No tasks in review.</li>}
          </ul>
        </div>

        <div className="card">
          <h2>Annotations</h2>
          {!bundle && <p>Select a task to review.</p>}
          {bundle && (
            <div className="annotation-list">
              {bundle.annotations.map((ann) => (
                <div key={ann.id} className="annotation-item">
                  <div className="annotation-row">
                    <strong>{ann.label}</strong>
                    <span className="badge">{ann.status}</span>
                  </div>
                  <div className="muted">
                    {ann.source} | {ann.geometry.type}
                    {ann.confidence !== null && ann.confidence !== undefined ? ` | conf ${ann.confidence.toFixed(2)}` : ""}
                  </div>
                  <div className="actions">
                    <button onClick={() => review(ann.id, "approve")}>Approve</button>
                    <button className="danger" onClick={() => review(ann.id, "reject")}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {bundle.annotations.length === 0 && <p>No annotations for selected task.</p>}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

