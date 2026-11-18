import {
  createEntry,
  deleteEntry,
  isDbConfigured,
  listEntries,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  if (!isDbConfigured()) {
    return json({ error: "database_not_configured" }, 503);
  }

  try {
    const entries = await listEntries();
    return json({ entries });
  } catch (error) {
    console.error("[guestbook] list failed:", error);
    return json({ error: "database_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return json({ error: "database_not_configured" }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const payload = body as { name?: unknown; message?: unknown } | null;
  const name = clean(payload?.name, 80);
  const message = clean(payload?.message, 500);

  if (name.length < 2) return json({ error: "name_too_short" }, 400);
  if (message.length < 3) return json({ error: "message_too_short" }, 400);

  try {
    const entry = await createEntry({ name, message });
    return json({ entry }, 201);
  } catch (error) {
    console.error("[guestbook] insert failed:", error);
    return json({ error: "database_unavailable" }, 503);
  }
}

export async function DELETE(request: Request) {
  if (!isDbConfigured()) {
    return json({ error: "database_not_configured" }, 503);
  }

  const configuredToken = process.env.ADMIN_TOKEN;
  const providedToken = request.headers.get("x-admin-token") ?? "";
  if (!configuredToken || providedToken !== configuredToken) {
    return json({ error: "unauthorized" }, 401);
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) {
    return json({ error: "invalid_id" }, 400);
  }

  try {
    const deleted = await deleteEntry(id);
    if (!deleted) return json({ error: "not_found" }, 404);
    return json({ deleted: true });
  } catch (error) {
    console.error("[guestbook] delete failed:", error);
    return json({ error: "database_unavailable" }, 503);
  }
}
