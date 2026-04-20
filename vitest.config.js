import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: "./tests/setup/global.js",
    setupFiles: ["./tests/setup/mongoose.js"],
    testTimeout: 60000, // replica set startup can take time
    hookTimeout: 60000,
    fileParallelism: false, // prevent cross-file beforeEach interference on shared DB
  },
});
