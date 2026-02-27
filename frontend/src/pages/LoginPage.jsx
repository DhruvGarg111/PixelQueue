import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, login } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";

const FEATURES = [
    {
        title: "Auto-Labeling",
        desc: "Generate starter annotations with YOLO segmentation and then edit them on canvas.",
        icon: "*",
    },
    {
        title: "Review Queue",
        desc: "Approve or reject annotations with revision-aware updates.",
        icon: "*",
    },
    {
        title: "Dataset Exports",
        desc: "Create COCO or YOLO archives in the background.",
        icon: "*",
    },
];

export function LoginPage() {
    const navigate = useNavigate();
    const setTokens = useAuthStore((s) => s.setTokens);
    const setMe = useAuthStore((s) => s.setMe);
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
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
            setError(getErrorMessage(err, "Login failed"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page-center">
            <section className="auth-layout">
                <div className="card auth-panel">
                    <div>
                        <p className="page-kicker">Collaborative Annotation</p>
                        <h1 className="page-title">Image Annotation Platform</h1>
                        <p className="muted small" style={{ marginTop: "0.5rem", lineHeight: 1.6 }}>
                            Label images, review results, and export training datasets from one workspace.
                        </p>
                    </div>

                    <div className="hero-insights">
                        <div className="hero-stat">
                            <strong>Live</strong>
                            <span>SSE Updates</span>
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
                        {FEATURES.map((f) => (
                            <div className="auth-bullet" key={f.title}>
                                <h3>
                                    <span style={{ marginRight: "0.45rem", opacity: 0.5 }}>{f.icon}</span>
                                    {f.title}
                                </h3>
                                <p className="muted small">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <form className="card auth-card form-grid" onSubmit={onSubmit}>
                    <p className="page-kicker">Workspace Access</p>
                    <h2 className="card-title" style={{ fontSize: "1.25rem" }}>Sign In</h2>
                    <p className="card-subtitle">Use your account to access projects, review queues, and exports.</p>
                    <label>
                        Email
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            autoComplete="current-password"
                        />
                    </label>
                    {error && <p className="error">{error}</p>}
                    <button disabled={loading} type="submit" style={{ marginTop: "0.25rem" }}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                    <span className="credential-pill">Demo credentials are pre-filled for quick access.</span>
                </form>
            </section>
        </main>
    );
}
