import pino from "pino";

export class AppLogger {
  private readonly logger: pino.Logger;

  constructor(name: string) {
    this.logger = pino({ name });
  }

  info(msg: string, data?: Record<string, unknown>): void {
    this.logger.info(data, msg);
  }

  error(msg: string, data?: Record<string, unknown>): void {
    this.logger.error(data, msg);
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    this.logger.warn(data, msg);
  }

  debug(msg: string, data?: Record<string, unknown>): void {
    this.logger.debug(data, msg);
  }

  child(bindings: Record<string, unknown>): AppLogger {
    const child = Object.create(AppLogger.prototype) as AppLogger;
    Object.defineProperty(child, "logger", {
      value: this.logger.child(bindings),
      writable: false,
    });
    return child;
  }
}
