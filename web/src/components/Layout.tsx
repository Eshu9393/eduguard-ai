import { NavLink, Outlet } from "react-router-dom";
import { HealthBadge } from "./HealthBadge";

const LINKS = [
  { to: "/", label: "Estimate", end: true },
  { to: "/how-it-works", label: "How it works" },
  { to: "/code-guide", label: "Code guide" },
  { to: "/about", label: "About" },
];

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
          <NavLink to="/" className="font-display text-xl font-semibold">
            EduGuard AI
          </NavLink>
          <nav
            aria-label="Main"
            className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto"
          >
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isActive ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <HealthBadge />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <Outlet />
      </main>

      <footer className="border-t border-line print:hidden">
        <p className="mx-auto max-w-5xl px-6 py-5 text-sm text-ink-soft">
          Estimates are statistical guidance, not definitive judgments about students.
          A person should always make the decision.
        </p>
      </footer>
    </div>
  );
}