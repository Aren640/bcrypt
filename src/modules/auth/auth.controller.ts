import { NextFunction, Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { ApiError } from "../../shared/errors/api-error";

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await authService.me(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
