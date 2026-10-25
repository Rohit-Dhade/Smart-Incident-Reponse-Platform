// scripts/listen.mjs
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    extraHeaders: { cookie: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhY2U0ZjdkMWEwNjFlZjhiMTA5M2FjYyIsIm9yZ2FuaXphdGlvbklkIjoiNmFjZTRmN2QxYTA2MWVmOGIxMDkzYWNiIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkyNDM1NDg4LCJleHAiOjE3OTMwNDAyODh9.YStVhj8LOfStBSqEA-rR_N9aK2udgfDmJjvg_nYt_qM" },
});

socket.on("connect", () => console.log("connected", socket.id));
socket.on("connect_error", (err) => console.log("rejected:", err.message));
socket.onAny((event, data) => console.log(event, JSON.stringify(data, null, 2)));