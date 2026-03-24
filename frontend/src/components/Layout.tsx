import {
  Briefcase,
  LogOut,
  MessageSquare,
  Settings,
  Star,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clearToken } from "../lib/auth";

const navItems = [
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/matches", label: "Matches", icon: Star },
  { to: "/outreach", label: "Outreach", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="font-bold text-gray-900 text-sm">TG Job Collector</h1>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                location.pathname.startsWith(to)
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => {
              clearToken();
              window.location.href = "/login";
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 w-full"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
