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
          <p className="page-kicker">Collaborative AI Platform</p>
          <h1 className="page-title">Annotation Workspace</h1>
          <p className="muted">
            Segment objects faster with assisted labeling, reviewer workflows, and one-click dataset exports.
          </p>
        </div>

        <form className="card auth-card" onSubmit={onSubmit}>
          <h2>Sign In</h2>
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
          <p className="muted small">Demo credentials are pre-filled for quick access.</p>
        </form>
      </section>
    </main>
  );
}
