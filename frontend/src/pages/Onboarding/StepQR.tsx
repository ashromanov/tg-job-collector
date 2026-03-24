import { useEffect, useRef, useState } from "react";
import { getQRStart, getQRStatus } from "../../api/settings";

interface Props {
  onNext: () => void;
}

export function StepQR({ onNext }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startQR();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function startQR() {
    setStatus("loading");
    setError(null);
    try {
      const res = await getQRStart();
      if (res.data.status === "already_authenticated") {
        onNext();
        return;
      }
      setQr(res.data.qr_base64);
      setStatus("waiting");
      pollRef.current = setInterval(poll, 2000);
    } catch (e: unknown) {
      const detail =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data
              ?.detail
          : undefined;
      setError(detail ?? "Failed to start QR login");
      setStatus("error");
    }
  }

  async function poll() {
    try {
      const res = await getQRStatus();
      if (res.data.status === "authenticated") {
        if (pollRef.current) clearInterval(pollRef.current);
        onNext();
      } else if (res.data.qr_base64) {
        setQr(res.data.qr_base64);
      }
    } catch {
      // silently retry
    }
  }

  return (
    <div className="text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Connect Telegram
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Scan the QR code with your Telegram mobile app to authorize.
      </p>

      {status === "loading" && (
        <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl animate-pulse" />
      )}

      {status === "waiting" && qr && (
        <div className="flex flex-col items-center gap-4">
          <img
            src={`data:image/png;base64,${qr}`}
            alt="QR code"
            className="w-48 h-48 rounded-xl border border-gray-200"
          />
          <p className="text-xs text-gray-400">
            Opens automatically once scanned
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="text-red-600 text-sm">
          {error}
          <button onClick={startQR} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
