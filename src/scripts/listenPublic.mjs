import { io } from "socket.io-client";

const slug = process.argv[2];
const socket = io("http://localhost:5000/public");

socket.on("connect", () => {
    socket.emit("subscribe", slug, (res) =>
        console.log("subscribe:", JSON.stringify(res, null, 2))
    );
});
socket.on("status:snapshot", (snap) => console.log("snapshot:", JSON.stringify(snap, null, 2)));
socket.on("connect_error", (err) => console.log("rejected:", err.message));