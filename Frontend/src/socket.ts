import { io } from "socket.io-client";

const SOCKET_ORIGIN =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  window.location.origin;

export function createSocket(namespace = "/") {
  return io(`${SOCKET_ORIGIN.replace(/\/$/, "")}${namespace}`, {
    path: "/socket.io",
    withCredentials: true,
  });
}
