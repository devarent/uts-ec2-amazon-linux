import { createUser } from "@/lib/db";
import {
  hashPassword,
  startUserSession,
} from "@/lib/auth";
import {
  isSameOriginRequest,
  privateJson,
  readJsonObject,
  sessionCookie,
} from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateJson({ error: "invalid_origin" }, 403);
  }

  const body = await readJsonObject(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 80) {
    return privateJson({ error: "invalid_name" }, 400);
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return privateJson({ error: "invalid_email" }, 400);
  }
  if (password.length < 12 || password.length > 128) {
    return privateJson({ error: "weak_password" }, 400);
  }

  try {
    const user = await createUser({
      name,
      email,
      passwordHash: await hashPassword(password),
    });
    const session = await startUserSession(user.id);
    return privateJson({ user }, 201, sessionCookie(session.token));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return privateJson({ error: "email_already_registered" }, 409);
    }
    console.error("[auth] registration failed:", error);
    return privateJson({ error: "registration_unavailable" }, 503);
  }
}
