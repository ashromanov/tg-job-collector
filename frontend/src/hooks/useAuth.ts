import { createContext, useContext, useEffect, useState } from "react";
import { getMe } from "../api/auth";
import { clearToken, getToken, setToken as storeToken } from "../lib/auth";

interface AuthState {
  token: string | null;
  onboardingComplete: boolean;
  loading: boolean;
  setOnboardingComplete: (v: boolean) => void;
  loginWithToken: (t: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuthProvider(): AuthState {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMe()
      .then(() =>
        import("../api/settings").then(({ getSettings }) =>
          getSettings()
            .then((r) => {
              setOnboardingComplete(r.data.onboarding_complete);
              setLoading(false);
            })
            .catch(() => setLoading(false)),
        ),
      )
      .catch(() => {
        clearToken();
        setTokenState(null);
        setLoading(false);
      });
  }, [token]);

  function loginWithToken(t: string) {
    storeToken(t);
    setTokenState(t);
  }

  function logout() {
    clearToken();
    setTokenState(null);
    setOnboardingComplete(false);
  }

  return {
    token,
    onboardingComplete,
    loading,
    setOnboardingComplete,
    loginWithToken,
    logout,
  };
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContext");
  return ctx;
}
