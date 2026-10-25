import { useEffect } from "react";

const BASE_TITLE = "StatusDesk — Incident response & public status pages";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · StatusDesk` : BASE_TITLE;
  }, [title]);
}
