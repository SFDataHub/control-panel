import type { ReactNode } from "react";
import useAuth from "../hooks/useAuth";

const ADMIN_ROLES = ["owner", "admin", "developer", "dev"];

function GateScreen({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="gate-screen">
      <div className="gate-card">
        <p className="content-shell__eyebrow">SFDataHub</p>
        <h1 className="gate-title">{title}</h1>
        <p className="gate-description">{description}</p>
        <div className="gate-actions">{children}</div>
      </div>
    </div>
  );
}

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, user, isLoading, login } = useAuth();
  const hasAdminRole = (user?.roles ?? []).some((role) => ADMIN_ROLES.includes(role.toLowerCase()));
  const isChecking = isLoading || status === "idle" || status === "loading";

  if (isChecking) {
    return (
      <GateScreen title="Loading Control Panel" description="Checking your session and permissions">
        <div className="topbar__badge topbar__badge--muted">
          <span className="topbar__spinner" aria-hidden="true" />
          <span>Loading session...</span>
        </div>
      </GateScreen>
    );
  }

  if (status === "authenticated" && hasAdminRole) {
    return children;
  }

  return (
    <GateScreen
      title="Login required"
      description="Dieses Control Panel ist nur fuer SFDataHub Owner & Admins. Bitte logge dich ein."
    >
      <div className="gate-buttons">
        <button
          type="button"
          className="topbar__login topbar__login--discord"
          onClick={() => login("discord")}
        >
          Login Discord
        </button>
        <button
          type="button"
          className="topbar__login topbar__login--google"
          onClick={() => login("google")}
        >
          Login Google
        </button>
      </div>
    </GateScreen>
  );
}
