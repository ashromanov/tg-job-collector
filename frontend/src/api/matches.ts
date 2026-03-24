import api from "./client";

export interface Match {
  id: string;
  job_id: string;
  cv_id: string;
  score: number;
  reasoning: string;
  status: string;
  created_at: string;
  job?: { title: string | null; company: string | null };
  cv?: { name: string };
}

export const listMatches = (params?: Record<string, string | number>) =>
  api.get<Match[]>("/matches", { params });
