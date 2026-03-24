import clsx from "clsx";

const colors: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  outreach_sent: "bg-blue-100 text-blue-700",
  outreach_pending: "bg-orange-100 text-orange-700",
  skipped: "bg-gray-100 text-gray-500",
  sent: "bg-green-100 text-green-700",
  waiting_qr: "bg-yellow-100 text-yellow-700",
  authenticated: "bg-green-100 text-green-700",
  disconnected: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex px-2 py-0.5 rounded text-xs font-medium",
        colors[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
