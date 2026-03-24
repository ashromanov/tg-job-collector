import api from "./client";

export const login = (username: string, password: string) =>
  api.post<{ access_token: string }>("/auth/login", { username, password });

export const getMe = () => api.get("/auth/me");
