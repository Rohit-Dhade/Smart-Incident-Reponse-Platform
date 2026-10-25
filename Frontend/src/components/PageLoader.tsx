import { Brand } from "./Brand";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Brand />
      <span className="page-loader__spinner" aria-hidden="true" />
      <p>{label}&hellip;</p>
    </div>
  );
}

export function SectionLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="section-loader" role="status" aria-live="polite">
      <span className="page-loader__spinner" aria-hidden="true" />
      <span>{label}&hellip;</span>
    </div>
  );
}
