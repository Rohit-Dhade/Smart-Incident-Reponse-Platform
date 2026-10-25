import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        env: {
            JWT_SECRET: "test-secret",
            NODE_ENV: "test",
            MISTRAL_API_KEY: "test-key",
            CLIENT_URL: "http://localhost:5173",
        },
        fileParallelism: false, 
        hookTimeout: 300_000, 
        testTimeout: 30_000,
    },
});