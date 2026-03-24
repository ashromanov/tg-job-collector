import { useEffect, useState } from "react";
import { getMe } from "../api/auth";
import { clearToken, getToken } from "../lib/auth";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(() => {
        import("../api/settings").then(({ getSettings }) => {
          getSettings()
            .then((r) => {
              setOnboardingComplete(r.data.onboarding_complete);
              setLoading(false);
            })
            .catch(() => {
              setLoading(false);
            });
        });
      })
      .catch(() => {
        clearToken();
        setTokenState(null);
        setLoading(false);
      });
  }, [token]);

  return { token, onboardingComplete, loading };
}
