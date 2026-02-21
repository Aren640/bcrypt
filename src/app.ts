import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { errorMiddleware } from "./shared/middleware/error.middleware";

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.status(200).json({ message: "API running", health: "/health" });
});

app.use("/auth", authRouter);
app.use(errorMiddleware);
