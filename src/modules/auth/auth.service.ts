import { prisma } from "../../shared/prisma/client";
import { ApiError } from "../../shared/errors/api-error";
import { comparePassword, hashPassword } from "../../shared/utils/password.util";
import { signAccessToken } from "../../shared/utils/jwt.util";
import { env } from "../../config/env";
import { LoginInput, RegisterInput } from "./auth.schema";

const toPublicUser = (user: { id: number; email: string; name: string | null; createdAt: Date }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
});

export const register = async (input: RegisterInput) => {
  const passwordHash = await hashPassword(input.password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const accessToken = signAccessToken({
    sub: String(user.id),
    email: user.email,
  });

  return {
    user: toPublicUser(user),
    accessToken,
    token: accessToken,
  };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValid = await comparePassword(input.password, user.passwordHash);

  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = signAccessToken({
    sub: String(user.id),
    email: user.email,
  });

  return {
    user: toPublicUser(user),
    accessToken,
    token: accessToken,
  };
};

export const me = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return toPublicUser(user);
};
