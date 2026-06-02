import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { clearStoredToken, getStoredToken } from "./api/client";
import { BrowserPage } from "./pages/BrowserPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProviderAccountsPage } from "./pages/ProviderAccountsPage";
import { ProvidersPage } from "./pages/ProvidersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SyncPage } from "./pages/SyncPage";
import { SyncedFilesPage } from "./pages/SyncedFilesPage";

function Protected({ children }: { children: React.ReactNode }) {
  return getStoredToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

function Shell() {
  const navigate = useNavigate();
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">7router</div>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/providers">Providers</Link>
          <Link to="/accounts">Accounts</Link>
          <Link to="/browser">Browser</Link>
          <Link to="/sync">Sync</Link>
          <Link to="/synced-files">Synced Files</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <button
          className="secondary"
          onClick={() => {
            clearStoredToken();
            navigate("/login");
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/providers" element={<ProvidersPage />} />
          <Route path="/accounts" element={<ProviderAccountsPage />} />
          <Route path="/browser" element={<BrowserPage />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/synced-files" element={<SyncedFilesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
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

