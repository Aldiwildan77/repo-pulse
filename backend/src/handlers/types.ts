import type { FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    username?: string;
  }
}

export type AuthenticatedRequest = FastifyRequest & {
  userId: string;
  username: string;
};
