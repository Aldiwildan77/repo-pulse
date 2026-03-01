import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadConfig } from "./infrastructure/config.js";
import { buildApp } from "./app.js";

let handler: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

async function getHandler() {
  if (handler) return handler;

  const config = loadConfig();
  const { app } = await buildApp(config);
  await app.ready();

  handler = async (req: VercelRequest, res: VercelResponse) => {
    app.server.emit("request", req, res);
  };

  return handler;
}

export default async function (req: VercelRequest, res: VercelResponse) {
  const h = await getHandler();
  h(req, res);
}
