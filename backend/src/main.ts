import { loadConfig } from "./infrastructure/config.js";
import { buildApp } from "./app.js";

async function main() {
  const config = loadConfig();
  const { app, infra } = await buildApp(config);

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    await infra.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
