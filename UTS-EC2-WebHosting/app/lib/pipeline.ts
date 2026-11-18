export type PipelineEnvironmentVariable = {
  name: string;
  value: string;
  type: "PLAINTEXT" | "PARAMETER_STORE" | "SECRETS_MANAGER";
};

export type PipelineConfiguration = {
  source: {
    actionName: string;
    provider: "bitbucket" | "github";
    connectionName: string;
    repository: string;
    branch: string;
    artifactFormat: "codepipeline-default" | "full-clone";
    variableNamespace: string;
    outputArtifacts: string[];
  };
  build: {
    actionName: string;
    region: string;
    inputArtifacts: string[];
    projectName: string;
    overrideBuildspec: boolean;
    buildspecPath: string;
    environmentVariables: PipelineEnvironmentVariable[];
    buildType: "single" | "batch";
    variableNamespace: string;
    outputArtifacts: string[];
  };
  deploy: {
    actionName: string;
    region: string;
    inputArtifacts: string[];
    applicationName: string;
    deploymentGroup: string;
    variableNamespace: string;
  };
};

export const DEFAULT_PIPELINE_CONFIGURATION: PipelineConfiguration = {
  source: {
    actionName: "Source",
    provider: "bitbucket",
    connectionName: "",
    repository: "",
    branch: "main",
    artifactFormat: "codepipeline-default",
    variableNamespace: "SourceVariables",
    outputArtifacts: ["SourceArtifact"],
  },
  build: {
    actionName: "Build",
    region: "ap-southeast-3",
    inputArtifacts: ["SourceArtifact"],
    projectName: "",
    overrideBuildspec: false,
    buildspecPath: "buildspec.yml",
    environmentVariables: [],
    buildType: "single",
    variableNamespace: "BuildVariables",
    outputArtifacts: ["BuildArtifact"],
  },
  deploy: {
    actionName: "Deploy",
    region: "ap-southeast-3",
    inputArtifacts: ["BuildArtifact"],
    applicationName: "",
    deploymentGroup: "",
    variableNamespace: "DeployVariables",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length <= maximum ? text : null;
}

function readList(value: unknown, fallback: string[]): string[] | null {
  if (value === undefined) return fallback;
  if (!Array.isArray(value) || value.length > 20) return null;
  const list = value.map((item) => readText(item, 100));
  if (list.some((item) => !item)) return null;
  return [...new Set(list as string[])];
}

function readEnvironmentVariables(
  value: unknown,
  legacyNames: unknown,
): PipelineEnvironmentVariable[] | null {
  if (value === undefined && Array.isArray(legacyNames)) {
    value = legacyNames.map((name) => ({ name, value: "", type: "PLAINTEXT" }));
  }
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 30) return null;
  const variables: PipelineEnvironmentVariable[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate)) return null;
    const name = readText(candidate.name, 100);
    const variableValue = readText(candidate.value, 512);
    const type = candidate.type;
    if (
      !name ||
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ||
      variableValue === null ||
      (type !== "PLAINTEXT" &&
        type !== "PARAMETER_STORE" &&
        type !== "SECRETS_MANAGER")
    ) {
      return null;
    }
    variables.push({ name, value: variableValue, type });
  }
  return variables;
}

export function parsePipelineConfiguration(
  value: unknown,
): PipelineConfiguration | null {
  if (!isRecord(value)) return null;
  const { source, build, deploy } = value;
  if (!isRecord(source) || !isRecord(build) || !isRecord(deploy)) return null;

  const provider = source.provider;
  const artifactFormat = source.artifactFormat;
  const buildType = build.buildType;
  if (
    (provider !== "bitbucket" && provider !== "github") ||
    (artifactFormat !== undefined &&
      artifactFormat !== "codepipeline-default" &&
      artifactFormat !== "full-clone") ||
    (buildType !== "single" && buildType !== "batch")
  ) {
    return null;
  }

  const actionName = readText(source.actionName ?? "Source", 100);
  const connectionName = readText(source.connectionName, 100);
  const repository = readText(source.repository, 200);
  const branch = readText(source.branch, 100);
  const sourceNamespace = readText(source.variableNamespace, 100);
  const sourceArtifacts = readList(
    source.outputArtifacts ?? (source.outputArtifact ? [source.outputArtifact] : undefined),
    DEFAULT_PIPELINE_CONFIGURATION.source.outputArtifacts,
  );
  const buildActionName = readText(build.actionName ?? "Build", 100);
  const buildRegion = readText(build.region, 32);
  const buildInputs = readList(
    build.inputArtifacts ??
      (build.inputArtifact ? [build.inputArtifact] : undefined),
    DEFAULT_PIPELINE_CONFIGURATION.build.inputArtifacts,
  );
  const projectName = readText(build.projectName, 100);
  const overrideBuildspec = build.overrideBuildspec ?? false;
  const buildspecPath = readText(build.buildspecPath, 200);
  const environmentVariables = readEnvironmentVariables(
    build.environmentVariables,
    build.environmentVariableNames,
  );
  const buildNamespace = readText(
    build.variableNamespace ?? DEFAULT_PIPELINE_CONFIGURATION.build.variableNamespace,
    100,
  );
  const buildArtifacts = readList(
    build.outputArtifacts,
    DEFAULT_PIPELINE_CONFIGURATION.build.outputArtifacts,
  );
  const deployActionName = readText(deploy.actionName ?? "Deploy", 100);
  const deployRegion = readText(deploy.region, 32);
  const deployInputs = readList(
    deploy.inputArtifacts ??
      (deploy.inputArtifact ? [deploy.inputArtifact] : undefined),
    DEFAULT_PIPELINE_CONFIGURATION.deploy.inputArtifacts,
  );
  const applicationName = readText(deploy.applicationName, 100);
  const deploymentGroup = readText(deploy.deploymentGroup, 100);
  const deployNamespace = readText(deploy.variableNamespace, 100);

  if (
    actionName === null ||
    connectionName === null ||
    repository === null ||
    branch === null ||
    sourceNamespace === null ||
    sourceArtifacts === null ||
    buildActionName === null ||
    !buildRegion ||
    buildInputs === null ||
    projectName === null ||
    typeof overrideBuildspec !== "boolean" ||
    !buildspecPath ||
    !environmentVariables ||
    buildNamespace === null ||
    buildArtifacts === null ||
    deployActionName === null ||
    !deployRegion ||
    deployInputs === null ||
    applicationName === null ||
    deploymentGroup === null ||
    deployNamespace === null
  ) {
    return null;
  }

  return {
    source: {
      actionName,
      provider,
      connectionName,
      repository,
      branch,
      artifactFormat:
        artifactFormat === "full-clone" ? "full-clone" : "codepipeline-default",
      variableNamespace: sourceNamespace,
      outputArtifacts: sourceArtifacts,
    },
    build: {
      actionName: buildActionName,
      region: buildRegion,
      inputArtifacts: buildInputs,
      projectName,
      overrideBuildspec,
      buildspecPath,
      environmentVariables,
      buildType,
      variableNamespace: buildNamespace,
      outputArtifacts: buildArtifacts,
    },
    deploy: {
      actionName: deployActionName,
      region: deployRegion,
      inputArtifacts: deployInputs,
      applicationName,
      deploymentGroup,
      variableNamespace: deployNamespace,
    },
  };
}
