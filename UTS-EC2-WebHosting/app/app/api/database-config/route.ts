import {
  getDatabaseConfiguration,
  saveDatabaseConfiguration,
} from "@/lib/db";
import { parseDatabaseConfiguration } from "@/lib/database-config";
import {
  isSameOriginRequest,
  privateJson,
  readJsonObject,
  userFromRequest,
} from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await userFromRequest(request);
    if (!user) return privateJson({ error: "unauthorized" }, 401);
    const stored = await getDatabaseConfiguration(user.id);
    const configuration = parseDatabaseConfiguration(stored);
    if (!configuration) {
      console.error("[database-config] stored configuration is invalid");
      return privateJson({ error: "database_configuration_invalid" }, 503);
    }
    return privateJson({ configuration });
  } catch (error) {
    console.error("[database-config] load failed:", error);
    return privateJson({ error: "database_configuration_unavailable" }, 503);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return privateJson({ error: "invalid_origin" }, 403);
  }
  try {
    const user = await userFromRequest(request);
    if (!user) return privateJson({ error: "unauthorized" }, 401);
    const body = await readJsonObject(request);
    const configuration = parseDatabaseConfiguration(body?.configuration);
    if (!configuration) {
      return privateJson({ error: "invalid_configuration" }, 400);
    }
    const saved = await saveDatabaseConfiguration({
      userId: user.id,
      configuration,
    });
    return privateJson({ configuration: saved });
  } catch (error) {
    console.error("[database-config] save failed:", error);
    return privateJson({ error: "database_configuration_unavailable" }, 503);
  }
}
