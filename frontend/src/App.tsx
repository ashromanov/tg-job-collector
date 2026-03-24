import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./hooks/useAuth";
import { Jobs } from "./pages/Jobs";
import { Login } from "./pages/Login";
import { Matches } from "./pages/Matches";
import { Onboarding } from "./pages/Onboarding";
import { Outreach } from "./pages/Outreach";
import { Settings } from "./pages/Settings";

function ProtectedRoutes() {
  const { token, onboardingComplete } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </Layout>
  );
}

function OnboardingRoute() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Onboarding />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<OnboardingRoute />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
