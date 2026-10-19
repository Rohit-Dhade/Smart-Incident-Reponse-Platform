import "dotenv/config";
import http from "http";
import mongoose from "mongoose";
import app from "./src/app.ts";
import { initSocket } from "./src/realtime/socket.ts";

const PORT = process.env.PORT ?? 5000;
const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
}

async function startServer() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected ✓");
        const httpServer = http.createServer(app);
        initSocket(httpServer);
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

startServer();