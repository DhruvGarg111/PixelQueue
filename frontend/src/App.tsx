import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { AnnotatePage } from "./pages/AnnotatePage";
import { ReviewPage } from "./pages/ReviewPage";
import { ExportsPage } from "./pages/ExportsPage";

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) {
    return <Navigate to="/login" replace />;
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
            <ProjectsPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/annotate"
        element={
          <Protected>
            <AnnotatePage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/review"
        element={
          <Protected>
            <ReviewPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/exports"
        element={
          <Protected>
            <ExportsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  );
}

