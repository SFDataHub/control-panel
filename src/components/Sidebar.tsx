import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

const mainNavItems = [
  { label: "Dashboard", to: "/" },
  { label: "Admin Users", to: "/users" },
  { label: "Access & Features", to: "/access" },
  { label: "Scans uploaded", to: "/admin/scans-uploaded" },
  { label: "Todo-Liste", to: "/admin/todo" },
  { label: "Feedback overview", to: "/admin/feedback" },
  { label: "Logs", to: "/logs" },
  { label: "APIs & Services", to: "/apis" },
  { label: "Settings", to: "/settings" },
];

const devNavItems = [{ label: "CLI Commands", to: "/cli-commands" }];

function hasDevAccess(roles: string[]) {
  return roles.some((role) => ["admin", "owner", "developer", "dev"].includes(role.toLowerCase()));
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const showDevTools = hasDevAccess(roles);

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar__header">
        <p>Control Panel</p>
        <small>Admin tools</small>
      </div>
      <nav className="sidebar__nav">
        {showDevTools && (
          <div className="sidebar__section">
            <p className="sidebar__section-title">Dev Tools</p>
            {devNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                }
                onClick={onClose}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="sidebar__section">
          <p className="sidebar__section-title">Navigation</p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
}
