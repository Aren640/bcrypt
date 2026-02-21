import { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error";
import { verifyAccessToken } from "../utils/jwt.util";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new ApiError(401, "Unauthorized"));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const id = Number(payload.sub);

    if (!Number.isInteger(id) || id <= 0) {
      next(new ApiError(401, "Unauthorized"));
      return;
    }

    req.user = { id, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, "Unauthorized"));
  }
};
