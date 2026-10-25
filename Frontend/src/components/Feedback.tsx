import type { ReactNode } from "react";

interface NoticeProps {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}

export function Notice({ tone = "error", children, onDismiss }: NoticeProps) {
  return (
    <div
      className={`notice notice--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="notice__content">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          className="notice__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          &times;
        </button>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  headingLevel?: "h1" | "h2" | "h3";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  headingLevel = "h3",
}: EmptyStateProps) {
  const Heading = headingLevel;

  return (
    <div className="empty-state">
      {icon ? (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <Heading className="empty-state__title">{title}</Heading>
      <p className="empty-state__description">{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
