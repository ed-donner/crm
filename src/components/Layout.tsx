import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

function makeIcon(path: ReactNode) {
  return ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const IconDashboard = makeIcon(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>,
);
const IconBuilding = makeIcon(
  <>
    <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
    <path d="M14 9h5a1 1 0 0 1 1 1v11" />
    <path d="M7 8h3M7 12h3M7 16h3" />
  </>,
);
const IconUsers = makeIcon(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M17.5 14.8c2.4.4 3.8 2.3 3.8 5" />
  </>,
);
const IconHandshake = makeIcon(
  <>
    <path d="m12 7 3-2.5a2 2 0 0 1 2.7.1l3.4 3.3a1.6 1.6 0 0 1 0 2.3l-5.6 5.5a1.6 1.6 0 0 1-2.3 0l-3.4-3.3" />
    <path d="M12 7 9 4.6a2 2 0 0 0-2.7.1L3 8a1.6 1.6 0 0 0 0 2.3l4.5 4.4" />
    <path d="m9 12 2 2M12 15l1.5 1.5" />
  </>,
);
const IconPipeline = makeIcon(
  <>
    <rect x="3" y="4" width="5" height="16" rx="1.2" />
    <rect x="9.5" y="4" width="5" height="11" rx="1.2" />
    <rect x="16" y="4" width="5" height="7" rx="1.2" />
  </>,
);

const NAV = [
  { to: "/", label: "Dashboard", icon: IconDashboard },
  { to: "/organizations", label: "Organizations", icon: IconBuilding },
  { to: "/contacts", label: "Contacts", icon: IconUsers },
  { to: "/deals", label: "Deals", icon: IconHandshake },
  { to: "/pipeline", label: "Pipeline", icon: IconPipeline },
] as const;

function isActive(to: string, pathname: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

export default function Layout() {
  const { pathname } = useLocation();
  const current = NAV.find((n) => isActive(n.to, pathname));
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <span className="brand__mark-inner" />
          </span>
          <span className="brand__name">Personal CRM</span>
        </div>
        <nav className="nav">
          {NAV.map((item) => {
            const active = isActive(item.to, pathname);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={`nav__item${active ? " nav__item--active" : ""}`}
              >
                <Icon className="nav__icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar__footer">
          <span className="dot dot--green" /> Local · No account
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1 className="topbar__title">{current?.label ?? "Personal CRM"}</h1>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
