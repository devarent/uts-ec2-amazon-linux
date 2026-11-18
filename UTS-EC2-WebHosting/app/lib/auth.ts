import {
  createHash,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import {
  createUserSession,
  findUserByEmail,
  findUserBySession,
  type AppUser,
} from "@/lib/db";

const scrypt = promisify(nodeScrypt);
export const SESSION_COOKIE = "ec2_lab_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  passwordHash: string | null,
): Promise<boolean> {
  const [algorithm, saltHex, digestHex] = (passwordHash ?? "").split("$");
  const validFormat =
    algorithm === "scrypt" &&
    /^[a-f0-9]{32}$/i.test(saltHex ?? "") &&
    /^[a-f0-9]{128}$/i.test(digestHex ?? "");
  const salt = validFormat ? Buffer.from(saltHex, "hex") : Buffer.alloc(16);
  const expected = validFormat
    ? Buffer.from(digestHex, "hex")
    : Buffer.alloc(64);
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return validFormat && timingSafeEqual(actual, expected);
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startUserSession(userId: number) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await createUserSession(userId, hashSessionToken(token), expiresAt);
  return { token, expiresAt };
}

export async function getUserForSessionToken(
  token: string | undefined,
): Promise<AppUser | null> {
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null;
  return findUserBySession(hashSessionToken(token));
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  return getUserForSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AppUser | null> {
  const user = await findUserByEmail(email);
  if (!(await verifyPassword(password, user?.password_hash ?? null))) return null;
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}
