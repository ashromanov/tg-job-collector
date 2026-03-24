import api from "./client";

export interface Channel {
  id: string;
  tg_id: number;
  username: string | null;
  title: string;
  monitored: boolean;
}

export const listChannels = () => api.get<Channel[]>("/channels");

export const syncChannels = () => api.get<Channel[]>("/channels/sync");

export const updateChannel = (id: string, monitored: boolean) =>
  api.patch<Channel>(`/channels/${id}`, { monitored });
