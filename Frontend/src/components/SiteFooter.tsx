import { Link } from "react-router-dom";
import { Brand } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Brand />
          <p>Incident response and public status pages in one place.</p>
        </div>
        <nav className="site-footer__links" aria-label="Footer">
          <Link to="/">Find a status page</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
        </nav>
      </div>
      <div className="container site-footer__bottom">
        <span>&copy; {new Date().getFullYear()} StatusDesk</span>
        <span>Built for teams who communicate.</span>
      </div>
    </footer>
  );
}
