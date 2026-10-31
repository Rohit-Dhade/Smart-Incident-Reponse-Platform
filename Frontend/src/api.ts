const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface RequestOptions {
  /** Suppress the global unauthorized event, e.g. while checking the session. */
  suppressAuthEvent?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const UNAUTHORIZED_EVENT = "statusdesk:unauthorized";

export interface UnauthorizedEventDetail {
  message?: string;
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  }

  const text = await response.text();
  let payload: ApiEnvelope<T> = {};
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !options.suppressAuthEvent) {
      window.dispatchEvent(
        new CustomEvent<UnauthorizedEventDetail>(UNAUTHORIZED_EVENT, {
          detail: { message: payload.message },
        }),
      );
    }
    const fallbackMessage =
      response.status === 429
        ? "Too many attempts. Please wait a few minutes and try again."
        : `Request failed (${response.status})`;
    throw new ApiError(payload.message ?? fallbackMessage, response.status);
  }

  return payload;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const payload = await request<T>(path, init, options);
  return payload.data as T;
}

export async function apiAction(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<string | undefined> {
  const payload = await request<unknown>(path, init, options);
  return payload.message;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
