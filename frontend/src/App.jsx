import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getMe } from "./api";
import { useAuthStore } from "./store/authStore";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { AnnotatePage } from "./pages/AnnotatePage";
import { ReviewPage } from "./pages/ReviewPage";
import { ExportsPage } from "./pages/ExportsPage";
import { AppLayout } from "./layouts/AppLayout";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

function Protected({ children }) {
    const token = useAuthStore((s) => s.accessToken);
    const me = useAuthStore((s) => s.me);
    const setMe = useAuthStore((s) => s.setMe);
    const clear = useAuthStore((s) => s.clear);

    useEffect(() => {
        if (!token || me) {
            return;
        }
        getMe()
            .then((nextMe) => setMe(nextMe))
            .catch(() => clear());
    }, [clear, me, setMe, token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }
    if (!me) {
        return (
            <main className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
                <div className="card" style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(0, 240, 255, 0.05)", border: "1px solid var(--brand)", boxShadow: "0 0 40px rgba(0, 240, 255, 0.1)" }}>
                    <div style={{ padding: "0.5rem 1rem", background: "var(--brand-dim)", color: "var(--brand)", borderRadius: "var(--radius-xs)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem", marginBottom: "1rem" }}>
                        Connecting...
                    </div>
                    <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>Initializing Matrix</h2>
                </div>
            </main>
        );
    }
    return <>{children}</>;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/projects"
                element={
                    <Protected>
                        <AppLayout>
                            <ErrorBoundary>
                                <ProjectsPage />
                            </ErrorBoundary>
                        </AppLayout>
                    </Protected>
                }
            />
            <Route
                path="/projects/:projectId/annotate"
                element={
                    <Protected>
                        <ErrorBoundary>
                            <AnnotatePage />
                        </ErrorBoundary>
                    </Protected>
                }
            />
            <Route
                path="/projects/:projectId/review"
                element={
                    <Protected>
                        <AppLayout>
                            <ErrorBoundary>
                                <ReviewPage />
                            </ErrorBoundary>
                        </AppLayout>
                    </Protected>
                }
            />
            <Route
                path="/projects/:projectId/exports"
                element={
                    <Protected>
                        <AppLayout>
                            <ErrorBoundary>
                                <ExportsPage />
                            </ErrorBoundary>
                        </AppLayout>
                    </Protected>
                }
            />
            <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
    );
}
