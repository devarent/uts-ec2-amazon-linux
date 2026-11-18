import { dbHealth } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const db = await dbHealth();
  const requireDb = process.env.REQUIRE_DB === "true";
  const healthy = !requireDb || db.status === "up";

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "uts-cloud-computing-ec2",
      version: process.env.APP_VERSION ?? "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
      uptime: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
      db: {
        status: db.status,
        latency_ms: db.latency_ms,
      },
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
