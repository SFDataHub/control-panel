import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import "./App.css";
import ApiStatusPage from "./pages/ApiStatusPage";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import AccessFeaturesPage from "./pages/AccessFeaturesPage";
import RequireAdmin from "./components/RequireAdmin";
import AdminScansUploaded from "./pages/admin/ScansUploaded";
import AdminFeedback from "./pages/admin/Feedback";
import TodoPage from "./pages/admin/TodoPage";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <RequireAdmin>
      <div className="app-shell">
        <Topbar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <div className="app-body">
          <Sidebar open={isSidebarOpen} onClose={closeSidebar} />
          <div
            className={`sidebar-overlay ${isSidebarOpen ? "is-visible" : ""}`}
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/access" element={<AccessFeaturesPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/admin/scans-uploaded" element={<AdminScansUploaded />} />
              <Route path="/admin/todo" element={<TodoPage />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/apis" element={<ApiStatusPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}

export default App;
