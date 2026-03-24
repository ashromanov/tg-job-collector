import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthContext, useAuth, useAuthProvider } from "./hooks/useAuth";
import { Jobs } from "./pages/Jobs";
import { Login } from "./pages/Login";
import { Matches } from "./pages/Matches";
import { Onboarding } from "./pages/Onboarding";
import { Outreach } from "./pages/Outreach";
import { Settings } from "./pages/Settings";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoutes() {
  const { token, onboardingComplete, loading } = useAuth();
  if (loading) return <Spinner />;
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
  const { token, onboardingComplete, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  if (onboardingComplete) return <Navigate to="/jobs" replace />;
  return <Onboarding />;
}

export default function App() {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
