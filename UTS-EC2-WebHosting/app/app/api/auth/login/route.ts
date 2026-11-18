import { authenticateUser, startUserSession } from "@/lib/auth";
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
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 128) {
    return privateJson({ error: "invalid_credentials" }, 400);
  }

  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      return privateJson({ error: "invalid_credentials" }, 401);
    }
    const session = await startUserSession(user.id);
    return privateJson({ user }, 200, sessionCookie(session.token));
  } catch (error) {
    console.error("[auth] login failed:", error);
    return privateJson({ error: "authentication_unavailable" }, 503);
  }
}
