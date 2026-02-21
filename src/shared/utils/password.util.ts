import bcrypt from "bcrypt";

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export const isValidPasswordPolicy = (password: string): boolean => {
  return PASSWORD_POLICY.test(password);
};

export const hashPassword = async (password: string, rounds: number): Promise<string> => {
  return bcrypt.hash(password, rounds);
};

export const comparePassword = async (password: string, passwordHash: string): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};
