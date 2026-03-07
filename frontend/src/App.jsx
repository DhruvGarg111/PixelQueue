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
            <main className="flex items-center justify-center h-screen bg-background-dark font-display">
                <div className="p-12 flex flex-col items-center bg-primary/5 border border-primary/20 shadow-[0_0_40px_rgba(13,223,242,0.1)] rounded-xl">
                    <div className="px-4 py-2 bg-primary/10 text-primary rounded font-mono uppercase tracking-widest text-sm mb-4 font-bold border border-primary/20">
                        Connecting...
                    </div>
                    <h2 className="text-2xl text-slate-100 m-0 tracking-tight font-bold">Initializing Matrix</h2>
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
