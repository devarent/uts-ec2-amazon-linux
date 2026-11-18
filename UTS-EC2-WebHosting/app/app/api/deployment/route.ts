import { LAB_STEPS } from "@/lib/lab";
import {
  isSameOriginRequest,
  privateJson,
  readJsonObject,
  userFromRequest,
} from "@/lib/api-auth";
import {
  listLabSectionConfigurations,
  listDeploymentProgress,
  saveDeploymentProgress,
} from "@/lib/db";
import { parseSectionConfiguration } from "@/lib/section-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await userFromRequest(request);
    if (!user) return privateJson({ error: "unauthorized" }, 401);
    const progress = await listDeploymentProgress(user.id);
    const configurations = await listLabSectionConfigurations(user.id);
    return privateJson({ steps: LAB_STEPS, progress, configurations });
  } catch (error) {
    console.error("[deployment] load failed:", error);
    return privateJson({ error: "deployment_unavailable" }, 503);
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
    const stepId = Number(body?.stepId);
    const selectedOptionId =
      typeof body?.selectedOptionId === "string" ? body.selectedOptionId : "";
    const completed = body?.completed;
    const configuration =
      stepId === 4
        ? undefined
        : parseSectionConfiguration(stepId, body?.configuration);
    const step = LAB_STEPS.find((item) => item.id === stepId);
    if (
      !step ||
      !step.options.some((option) => option.id === selectedOptionId) ||
      typeof completed !== "boolean" ||
      (stepId !== 4 && !configuration)
    ) {
      return privateJson({ error: "invalid_configuration" }, 400);
    }

    const progress = await saveDeploymentProgress({
      userId: user.id,
      stepId,
      selectedOptionId,
      completed,
      configuration: configuration ?? undefined,
    });
    return privateJson({ progress, configuration });
  } catch (error) {
    console.error("[deployment] save failed:", error);
    return privateJson({ error: "deployment_unavailable" }, 503);
  }
}
