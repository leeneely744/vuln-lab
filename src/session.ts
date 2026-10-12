// session id -> username
export const mySessions = new Map<string, string>();


import * as bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
}