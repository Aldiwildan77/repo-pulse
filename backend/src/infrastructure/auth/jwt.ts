import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  username: string;
  type: "access" | "refresh";
}

export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly accessExpiry: string,
    private readonly refreshExpiry: string,
  ) {}

  signAccessToken(payload: Omit<JwtPayload, "type">): string {
    return jwt.sign({ ...payload, type: "access" }, this.secret, {
      expiresIn: this.accessExpiry as jwt.SignOptions["expiresIn"],
    });
  }

  signRefreshToken(payload: Omit<JwtPayload, "type">): string {
    return jwt.sign({ ...payload, type: "refresh" }, this.secret, {
      expiresIn: this.refreshExpiry as jwt.SignOptions["expiresIn"],
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    const payload = jwt.verify(token, this.secret) as JwtPayload;
    if (payload.type !== "access") {
      throw new Error("Invalid token type: expected access token");
    }
    return payload;
  }

  verifyRefreshToken(token: string): JwtPayload {
    const payload = jwt.verify(token, this.secret) as JwtPayload;
    if (payload.type !== "refresh") {
      throw new Error("Invalid token type: expected refresh token");
    }
    return payload;
  }
}
