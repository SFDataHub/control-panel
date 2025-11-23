import { NavLink } from "react-router-dom";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Admin Users", to: "/users" },
  { label: "Logs", to: "/logs" },
  { label: "APIs & Services", to: "/apis" },
  { label: "Settings", to: "/settings" },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar__header">
        <p>Control Panel</p>
        <small>Admin tools</small>
      </div>
      <nav className="sidebar__nav">
        {navItems.map((item) => (
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
      </nav>
    </aside>
  );
}
