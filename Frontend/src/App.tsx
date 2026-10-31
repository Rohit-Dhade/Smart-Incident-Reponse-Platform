import { useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { GuestOnly, RequireAuth } from "./auth/guards";
import { EmptyState } from "./components/Feedback";
import { GlobeIcon } from "./components/Icons";
import { SiteHeader } from "./components/SiteHeader";
import { usePageTitle } from "./hooks/usePageTitle";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { IncidentPage } from "./pages/IncidentPage";
import { LoginPage } from "./pages/LoginPage";
import { PublicStatusPage } from "./pages/PublicStatusPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { TeamPage } from "./pages/TeamPage";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function NotFoundPage() {
  const { session } = useAuth();
  usePageTitle("Page not found");

  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="container page-state">
        <EmptyState
          icon={<GlobeIcon size={24} />}
          title="Page not found"
          description="The page you were looking for does not exist or has moved."
          headingLevel="h1"
          action={
            <div className="page-state__actions">
              <Link className="btn btn--primary" to="/">
                Find a status page
              </Link>
              {session ? (
                <Link className="btn btn--secondary" to="/dashboard">
                  Go to dashboard
                </Link>
              ) : (
                <Link className="btn btn--secondary" to="/login">
                  Sign in
                </Link>
              )}
            </div>
          }
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/status/:slug" element={<PublicStatusPage />} />
          <Route path="/status" element={<Navigate to="/" replace />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/incidents/:id" element={<IncidentPage />} />
            <Route path="/incidents" element={<Navigate to="/dashboard" replace />} />
            <Route path="/team" element={<TeamPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
