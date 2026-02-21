import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../errors/api-error";

export const errorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      issues: err.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
    res.status(409).json({ message: "Resource already exists" });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
};
