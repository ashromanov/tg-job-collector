import api from "./client";

export interface OutreachLog {
  id: string;
  match_id: string;
  tg_contact: string;
  message_text: string;
  sent_at: string | null;
  status: string;
  error_msg: string | null;
}

export const listOutreach = (params?: Record<string, string>) =>
  api.get<OutreachLog[]>("/outreach", { params });

export const retryOutreach = (id: string) => api.post(`/outreach/${id}/retry`);
