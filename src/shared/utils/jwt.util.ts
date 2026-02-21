import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    issuer: env.JWT_ISSUER,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: env.JWT_ISSUER,
  }) as jwt.JwtPayload;

  if (!decoded.sub || !decoded.email || typeof decoded.sub !== "string" || typeof decoded.email !== "string") {
    throw new Error("Invalid token payload");
  }

  return { sub: decoded.sub, email: decoded.email };
};
