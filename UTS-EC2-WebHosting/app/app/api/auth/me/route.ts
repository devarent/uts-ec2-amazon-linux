import { privateJson, userFromRequest } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await userFromRequest(request);
    return user
      ? privateJson({ user })
      : privateJson({ error: "unauthorized" }, 401);
  } catch (error) {
    console.error("[auth] session lookup failed:", error);
    return privateJson({ error: "authentication_unavailable" }, 503);
  }
}
