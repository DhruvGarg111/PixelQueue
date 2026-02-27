import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, login } from "../api";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setMe = useAuthStore((s) => s.setMe);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens = await login(email, password);
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await getMe();
      setMe(me);
      navigate("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-center">
      <section className="auth-layout">
        <div className="card auth-panel">
          <div>
            <p className="page-kicker">Collaborative AI Platform</p>
            <h1 className="page-title">Precision Labeling Ops</h1>
            <p className="muted">
              Build consistent segmentation datasets with human review loops, live collaboration, and export automation.
            </p>
          </div>

          <div className="hero-insights">
            <div className="hero-stat">
              <strong>Live</strong>
              <span>Event Updates</span>
            </div>
            <div className="hero-stat">
              <strong>Dual</strong>
              <span>Auto + Manual</span>
            </div>
            <div className="hero-stat">
              <strong>COCO/YOLO</strong>
              <span>Export Ready</span>
            </div>
          </div>

          <div className="auth-bullets">
            <div className="auth-bullet">
              <h3>Assisted Annotation</h3>
              <p className="muted small">Run auto-labeling and refine masks in one continuous workspace.</p>
            </div>
            <div className="auth-bullet">
              <h3>Review Pipeline</h3>
              <p className="muted small">Approve or reject annotations with traceable status updates.</p>
            </div>
          </div>
        </div>

        <form className="card auth-card form-grid" onSubmit={onSubmit}>
          <p className="page-kicker">Workspace Access</p>
          <h2 className="card-title">Sign In</h2>
          <p className="card-subtitle">Authenticate to access projects, review queues, and export jobs.</p>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <span className="credential-pill">Demo credentials are pre-filled for quick access.</span>
        </form>
      </section>
    </main>
  );
}
