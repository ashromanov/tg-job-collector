import api from "./client";

export interface Job {
  id: string;
  title: string | null;
  company: string | null;
  city: string | null;
  country: string | null;
  is_remote: boolean | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  employment_type: string | null;
  tech_stack: string[];
  experience_level: string | null;
  tg_contact: string | null;
  emails: string[];
  phones: string[];
  apply_links: string[];
  post_link: string | null;
  post_date: string | null;
  extraction_status: string;
  raw_text: string;
  created_at: string;
}

export const listJobs = (params?: Record<string, string | number>) =>
  api.get<Job[]>("/jobs", { params });

export const getJob = (id: string) => api.get<Job>(`/jobs/${id}`);
