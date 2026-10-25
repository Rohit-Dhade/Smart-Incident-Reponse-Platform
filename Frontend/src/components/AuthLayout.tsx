import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { ActivityIcon, LockIcon, UsersIcon } from "./Icons";

interface AuthLayoutProps {
  children: ReactNode;
  variant?: "default" | "register";
}

export function AuthLayout({
  children,
  variant = "default",
}: AuthLayoutProps) {
  return (
    <div
      className={`auth-shell ${
        variant === "register" ? "auth-shell--register" : ""
      }`.trim()}
    >
      <div className="auth-main">
        <div className="auth-main__top">
          <Brand />
        </div>
        <main id="main" tabIndex={-1} className="auth-main__content">
          {children}
        </main>
        <footer className="auth-main__footer">
          <span>&copy; {new Date().getFullYear()} StatusDesk</span>
          <span>Incident response and status pages.</span>
        </footer>
      </div>

      <aside className="auth-aside">
        <div className="auth-aside__glow" aria-hidden="true" />
        <div className="auth-aside__content">
          <p className="eyebrow eyebrow--on-dark">Built for the response</p>
          <h2 className="auth-aside__headline">
            One timeline. Every responder. Customers in the loop.
          </h2>
          <p className="auth-aside__lede">
            Keep the internal response and the public message in the same place.
            No copy-pasting updates into a separate tool.
          </p>

          <ul className="auth-feature-list">
            <li>
              <span className="auth-feature-list__icon" aria-hidden="true">
                <ActivityIcon size={18} />
              </span>
              <div>
                <strong>Public and internal updates</strong>
                <span>
                  Post the detail your team needs, then choose what customers
                  see.
                </span>
              </div>
            </li>
            <li>
              <span className="auth-feature-list__icon" aria-hidden="true">
                <LockIcon size={18} />
              </span>
              <div>
                <strong>Roles that fit the work</strong>
                <span>
                  Admins, responders, and viewers each get the access they
                  need.
                </span>
              </div>
            </li>
            <li>
              <span className="auth-feature-list__icon" aria-hidden="true">
                <UsersIcon size={18} />
              </span>
              <div>
                <strong>A live public status page</strong>
                <span>
                  Every workspace includes a shareable page at
                  /status/your-organization.
                </span>
              </div>
            </li>
          </ul>
        </div>

        <p className="auth-aside__footnote">
          Public status pages &middot; Private incident workspaces
        </p>
      </aside>
    </div>
  );
}
