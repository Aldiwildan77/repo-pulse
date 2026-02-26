import { loadConfig } from "./infrastructure/config.js";
import { buildApp } from "./app.js";

async function main() {
  const config = loadConfig();
  const app = await buildApp(config);

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
