import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import type { Config } from "./infrastructure/config.js";
import { InfrastructureFactory } from "./infrastructure/factory.js";
import { RepositoryFactory } from "./repositories/factory.js";
import { ModuleFactory } from "./core/modules/factory.js";
import { HandlerFactory } from "./handlers/factory.js";

export async function buildApp(config: Config) {
  const app = Fastify({
    logger: true,
  });

  // Plugins
  await app.register(cors, {
    origin: config.frontendUrl,
    credentials: true,
  });

  await app.register(cookie);

  // Wire dependencies
  const infra = new InfrastructureFactory(config);
  const repos = new RepositoryFactory(infra);
  const modules = new ModuleFactory(config, repos, infra);
  const handlers = new HandlerFactory(config, modules, infra);

  // Register routes
  handlers.registerAll(app);

  return app;
}
