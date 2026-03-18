import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getMe } from "./api";
import { useAuthStore } from "./store/authStore";
import { AppLayout } from "./layouts/AppLayout";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

const LoginPage = lazy(() => import("./pages/LoginPage").then((mod) => ({ default: mod.LoginPage })));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage").then((mod) => ({ default: mod.ProjectsPage })));
const AnnotatePage = lazy(() => import("./pages/AnnotatePage").then((mod) => ({ default: mod.AnnotatePage })));
const ReviewPage = lazy(() => import("./pages/ReviewPage").then((mod) => ({ default: mod.ReviewPage })));
const ExportsPage = lazy(() => import("./pages/ExportsPage").then((mod) => ({ default: mod.ExportsPage })));

function RouteLoader({ label }) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background-dark font-display">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-10 py-8 text-center shadow-[0_0_40px_rgba(13,223,242,0.08)]">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background-dark/80 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.35em] text-primary">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {label}
                </div>
                <p className="text-sm text-slate-300">Staging the next workspace module.</p>
            </div>
        </main>
    );
}

function useSessionBootstrap() {
    const bootstrapped = useAuthStore((s) => s.bootstrapped);
    const setMe = useAuthStore((s) => s.setMe);
    const clear = useAuthStore((s) => s.clear);

    useEffect(() => {
        if (bootstrapped) {
            return;
        }

        let active = true;
        getMe()
            .then((nextMe) => {
                if (active) {
                    setMe(nextMe);
                }
            })
            .catch(() => {
                if (active) {
                    clear();
                }
            });

        return () => {
            active = false;
        };
    }, [bootstrapped, clear, setMe]);
}

function Protected({ children }) {
    const me = useAuthStore((s) => s.me);
    const bootstrapped = useAuthStore((s) => s.bootstrapped);

    if (!bootstrapped) {
        return <RouteLoader label="Syncing session" />;
    }
    if (!me) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
}

function PublicOnly({ children }) {
    const me = useAuthStore((s) => s.me);
    const bootstrapped = useAuthStore((s) => s.bootstrapped);

    if (!bootstrapped) {
        return <RouteLoader label="Checking access" />;
    }
    if (me) {
        return <Navigate to="/projects" replace />;
    }
    return <>{children}</>;
}

export default function App() {
    useSessionBootstrap();

    return (
        <Suspense fallback={<RouteLoader label="Loading module" />}>
            <Routes>
                <Route
                    path="/login"
                    element={(
                        <PublicOnly>
                            <LoginPage mode="login" />
                        </PublicOnly>
                    )}
                />
                <Route
                    path="/register"
                    element={(
                        <PublicOnly>
                            <LoginPage mode="register" />
                        </PublicOnly>
                    )}
                />
                <Route
                    path="/projects"
                    element={(
                        <Protected>
                            <AppLayout>
                                <ErrorBoundary>
                                    <ProjectsPage />
                                </ErrorBoundary>
                            </AppLayout>
                        </Protected>
                    )}
                />
                <Route
                    path="/projects/:projectId/annotate"
                    element={(
                        <Protected>
                            <ErrorBoundary>
                                <AnnotatePage />
                            </ErrorBoundary>
                        </Protected>
                    )}
                />
                <Route
                    path="/projects/:projectId/review"
                    element={(
                        <Protected>
                            <AppLayout>
                                <ErrorBoundary>
                                    <ReviewPage />
                                </ErrorBoundary>
                            </AppLayout>
                        </Protected>
                    )}
                />
                <Route
                    path="/projects/:projectId/exports"
                    element={(
                        <Protected>
                            <AppLayout>
                                <ErrorBoundary>
                                    <ExportsPage />
                                </ErrorBoundary>
                            </AppLayout>
                        </Protected>
                    )}
                />
                <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
        </Suspense>
    );
}
