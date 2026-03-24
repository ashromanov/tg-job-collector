import api from "./client";
import type { Channel } from "./channels";

export interface AppSettings {
  openrouter_api_key: string;
  llm_model: string;
  outreach_paused: boolean;
  onboarding_complete: boolean;
}

export interface Prompt {
  name: string;
  content: string;
}

export const getSettings = () => api.get<AppSettings>("/settings");

export const updateSettings = (data: Partial<AppSettings>) =>
  api.put<AppSettings>("/settings", data);

export const listPrompts = () => api.get<Prompt[]>("/settings/prompts");

export const updatePrompt = (name: string, content: string) =>
  api.put<Prompt>(`/settings/prompts/${name}`, { content });

export const testPrompt = (name: string, sample_text: string) =>
  api.post<{ result: string }>(`/settings/prompts/${name}/test`, {
    sample_text,
  });

export const getQRStart = () =>
  api.get<{ qr_base64: string; expires_at: string; status?: string }>(
    "/collector/qr/start"
  );

export const getQRStatus = () =>
  api.get<{ status: string; qr_base64: string | null }>(
    "/collector/qr/status"
  );

export const getCollectorChannels = () =>
  api.get<Channel[]>("/collector/channels");

export const setChannelMonitored = (tg_id: number, monitored: boolean) =>
  api.patch(`/collector/channels/${tg_id}/monitor`, { monitored });
