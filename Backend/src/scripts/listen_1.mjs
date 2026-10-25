// scripts/listen.mjs
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    extraHeaders: { cookie: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhY2E5ODhhMzczZWY4NGQyN2EyYzA4NyIsIm9yZ2FuaXphdGlvbklkIjoiNmFjYTk4OGEzNzNlZjg0ZDI3YTJjMDg2Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkxOTA2MTM0LCJleHAiOjE3OTI1MTA5MzR9.ijii6CXgUiA42b7hReIUbMT90HrViBG7BH_ZPXQg_qM" },
});

socket.on("connect", () => console.log("connected", socket.id));
socket.on("connect_error", (err) => console.log("rejected:", err.message));
socket.onAny((event, data) => console.log(event, JSON.stringify(data, null, 2)));