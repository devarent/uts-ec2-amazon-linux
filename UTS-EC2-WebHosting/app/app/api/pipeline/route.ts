import {
  getPipelineConfiguration,
  savePipelineConfiguration,
} from "@/lib/db";
import { parsePipelineConfiguration } from "@/lib/pipeline";
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

    const stored = await getPipelineConfiguration(user.id);
    const configuration = parsePipelineConfiguration(stored);
    if (!configuration) {
      console.error("[pipeline] stored configuration is invalid");
      return privateJson({ error: "pipeline_configuration_invalid" }, 503);
    }
    return privateJson({ configuration });
  } catch (error) {
    console.error("[pipeline] load failed:", error);
    return privateJson({ error: "pipeline_unavailable" }, 503);
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
    const configuration = parsePipelineConfiguration(body?.configuration);
    if (!configuration) {
      return privateJson({ error: "invalid_configuration" }, 400);
    }

    const saved = await savePipelineConfiguration({
      userId: user.id,
      configuration,
    });
    return privateJson({ configuration: saved });
  } catch (error) {
    console.error("[pipeline] save failed:", error);
    return privateJson({ error: "pipeline_unavailable" }, 503);
  }
}
