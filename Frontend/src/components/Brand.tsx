import { Link } from "react-router-dom";

interface BrandProps {
  to?: string;
  className?: string;
}

export function Brand({ to = "/", className = "" }: BrandProps) {
  return (
    <Link
      to={to}
      className={`brand ${className}`.trim()}
      aria-label="StatusDesk home"
    >
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M7 17h4.2l2.1-5.8 4 12.1 2.4-6.3H25"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="brand__word">StatusDesk</span>
    </Link>
  );
}
