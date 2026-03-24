import api from "./client";

export interface CV {
  id: string;
  name: string;
  match_threshold: number;
  active: boolean;
  cv_link: string | null;
  file_path: string | null;
  created_at: string;
}

export const listCVs = () => api.get<CV[]>("/cvs");

export const uploadCV = (
  file: File,
  name: string,
  threshold: number,
  cvLink?: string
) => {
  const form = new FormData();
  form.append("file", file);
  form.append("name", name);
  form.append("match_threshold", String(threshold));
  if (cvLink) form.append("cv_link", cvLink);
  return api.post<CV>("/cvs", form);
};

export const updateCV = (id: string, data: Partial<CV>) =>
  api.patch<CV>(`/cvs/${id}`, data);

export const deleteCV = (id: string) => api.delete(`/cvs/${id}`);
