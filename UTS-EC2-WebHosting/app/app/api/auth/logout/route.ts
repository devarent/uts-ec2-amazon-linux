import {
  clearUserSession,
  expiredSessionCookie,
  isSameOriginRequest,
  privateJson,
} from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateJson({ error: "invalid_origin" }, 403);
  }
  try {
    await clearUserSession(request);
    return privateJson({ logged_out: true }, 200, expiredSessionCookie());
  } catch (error) {
    console.error("[auth] logout failed:", error);
    return privateJson({ error: "logout_unavailable" }, 503);
  }
}
