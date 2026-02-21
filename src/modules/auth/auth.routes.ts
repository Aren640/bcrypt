import { Router } from "express";
import * as authController from "./auth.controller";
import { authMiddleware } from "../../shared/middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", authMiddleware, authController.me);
