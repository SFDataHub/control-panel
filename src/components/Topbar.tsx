import { useEffect, useMemo, useRef, useState } from "react";
import useAuth, { type AuthProvider } from "../hooks/useAuth";

type TopbarProps = {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
};

export default function Topbar({ onToggleSidebar, isSidebarOpen }: TopbarProps) {
  const { user, status, isLoading, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    return user.displayName || user.providers?.[user.provider]?.displayName || "User";
  }, [user]);

  const avatarUrl = useMemo(() => {
    if (user?.avatarUrl) return user.avatarUrl;
    const providerAvatar = user?.providers?.[user?.provider ?? "discord" as AuthProvider]?.avatarUrl;
    if (providerAvatar) return providerAvatar;
    return null;
  }, [user]);

  const roleBadges = useMemo(() => {
    const roles = user?.roles ?? [];
    return roles.filter((role) => ["admin", "moderator", "mod"].includes(role.toLowerCase()));
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLoading) {
      setMenuOpen(false);
    }
  }, [isLoading]);

  const handleLogin = (provider: AuthProvider) => {
    login(provider);
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__burger"
          aria-label="Toggle navigation"
          aria-expanded={isSidebarOpen ?? false}
          onClick={onToggleSidebar}
        >
          <span />
          <span />
          <span />
        </button>
        <div className="topbar__branding">
          <span className="topbar__logo">SFDataHub</span>
          <span className="topbar__subtitle">Control Panel</span>
        </div>
      </div>
      <div className="topbar__user">
        {isLoading ? (
          <div className="topbar__badge topbar__badge--muted">
            <span className="topbar__spinner" aria-hidden="true" />
            <span className="sr-only">Checking session...</span>
            <span>Loading</span>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="topbar__auth">
            <button
              type="button"
              className="topbar__login topbar__login--discord"
              onClick={() => handleLogin("discord")}
            >
              Login Discord
            </button>
            <button
              type="button"
              className="topbar__login topbar__login--google"
              onClick={() => handleLogin("google")}
            >
              Login Google
            </button>
          </div>
        ) : (
          <div className="topbar__account" ref={accountRef}>
            <button
              type="button"
              className="topbar__account-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {avatarUrl ? (
                <img className="topbar__avatar-img" src={avatarUrl} alt={displayName} />
              ) : (
                <div className="topbar__avatar">{displayName?.[0] ?? "A"}</div>
              )}
              <div className="topbar__meta">
                <p>{displayName}</p>
                <div className="topbar__roles">
                  {roleBadges.length === 0 ? <small className="topbar__role">User</small> : null}
                  {roleBadges.map((role) => (
                    <span key={role} className="topbar__role topbar__role--badge">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </button>
            {menuOpen && (
              <div className="topbar__dropdown" role="menu">
                <div className="topbar__dropdown-header">
                  <p className="topbar__dropdown-name">{displayName}</p>
                  <p className="topbar__dropdown-sub">Signed in via {user?.provider}</p>
                </div>
                <button type="button" className="topbar__dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
