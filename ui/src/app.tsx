import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { clearStoredToken, getStoredToken } from "./api/client";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { StoragePage } from "./pages/StoragePage";
import { AccessTokensPage } from "./pages/AccessTokensPage";

import { UseCasePage } from "./pages/UseCasePage";

function Protected({ children }: { children: React.ReactNode }) {
  return getStoredToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

const nav = [
  {
    to: "/",
    end: true,
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/storage",
    label: "Storage",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    to: "/tokens",
    label: "Access Tokens",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
  {
    to: "/use-cases",
    label: "Use Cases",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

function Shell() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)]">
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--muted)] flex flex-col">
        <div className="px-5 py-5 border-b border-[var(--border)]">
          <span className="text-xl font-bold tracking-tight text-white">7Router</span>
          <p className="text-xs text-gray-500 mt-0.5">Storage Gateway</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-[var(--border)] space-y-3">
          <p className="text-xs text-gray-600">localhost:20132</p>
          <button
            onClick={() => {
              clearStoredToken();
              navigate("/login");
            }}
            className="w-full text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-gray-500 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/storage" element={<StoragePage />} />

          <Route path="/tokens" element={<AccessTokensPage />} />
          <Route path="/use-cases" element={<UseCasePage />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Shell />
          </Protected>
        }
      />
    </Routes>
  );
}
