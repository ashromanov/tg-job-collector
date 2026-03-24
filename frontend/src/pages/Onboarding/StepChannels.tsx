import { useEffect, useState } from "react";
import { type Channel, updateChannel } from "../../api/channels";
import { syncChannels } from "../../api/channels";
import { RefreshCw } from "lucide-react";

interface Props {
  onNext: () => void;
}

export function StepChannels({ onNext }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    setLoading(true);
    setError(null);
    try {
      const res = await syncChannels();
      setChannels(res.data);
    } catch {
      setError("Failed to sync channels from Telegram");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(channel: Channel) {
    setToggling((prev) => new Set(prev).add(channel.id));
    try {
      const res = await updateChannel(channel.id, !channel.monitored);
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? res.data : c))
      );
    } catch {
      setError(`Failed to update channel "${channel.title}"`);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(channel.id);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Select Channels</h2>
        <button
          onClick={loadChannels}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Toggle channels you want to monitor for job posts.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8 mb-6">
          No channels found. Make sure your Telegram account has joined some
          channels.
        </p>
      ) : (
        <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-white"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {channel.title}
                </p>
                {channel.username && (
                  <p className="text-xs text-gray-400">@{channel.username}</p>
                )}
              </div>
              <button
                onClick={() => handleToggle(channel)}
                disabled={toggling.has(channel.id)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                  channel.monitored ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    channel.monitored ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
