export const DATABASE_PROVIDERS = [
  "docker-postgres17",
  "rds-postgres",
  "rds-mysql",
  "aurora-postgresql",
  "aurora-mysql",
  "redshift-serverless",
  "rds-mariadb",
  "rds-sqlserver",
  "rds-oracle",
  "documentdb",
  "neptune",
  "elasticache-redis",
  "opensearch",
  "external-postgres",
  "external-mysql",
  "external-mariadb",
] as const;

export type DatabaseProvider = (typeof DATABASE_PROVIDERS)[number];

export const DATABASE_PROVIDER_CHECKLIST_OPTIONS: Record<DatabaseProvider, string> = {
  "docker-postgres17": "docker-postgres17",
  "rds-postgres": "rds-postgres-private",
  "rds-mysql": "rds-mysql-private",
  "aurora-postgresql": "aurora-postgresql-private",
  "aurora-mysql": "aurora-mysql-private",
  "redshift-serverless": "redshift-serverless-private",
  "rds-mariadb": "rds-mariadb-private",
  "rds-sqlserver": "rds-sqlserver-private",
  "rds-oracle": "rds-oracle-private",
  documentdb: "documentdb-private",
  neptune: "neptune-private",
  "elasticache-redis": "elasticache-redis-private",
  opensearch: "opensearch-private",
  "external-postgres": "external-postgres",
  "external-mysql": "external-mysql",
  "external-mariadb": "external-mariadb",
};

export type DatabaseConfiguration = {
  provider: DatabaseProvider;
  region: string;
  resourceName: string;
  databaseName: string;
  engineVersion: string;
  instanceClass: string;
  storageGb: number;
  storageType: "gp3" | "io2";
  backupRetentionDays: number;
  multiAz: boolean;
  storageEncrypted: boolean;
  deletionProtection: boolean;
  publicAccess: false;
  networkMode: "docker-internal" | "private-subnets" | "external-endpoint";
  port: number;
  endpointType: "localhost" | "ipv4" | "dns" | "docker-service";
  endpointHost: string;
};

export const DEFAULT_DATABASE_CONFIGURATION: DatabaseConfiguration = {
  provider: "docker-postgres17",
  region: "ap-southeast-3",
  resourceName: "ec2-lab-database",
  databaseName: "ec2lab",
  engineVersion: "17",
  instanceClass: "db.t4g.micro",
  storageGb: 20,
  storageType: "gp3",
  backupRetentionDays: 7,
  multiAz: false,
  storageEncrypted: true,
  deletionProtection: true,
  publicAccess: false,
  networkMode: "docker-internal",
  port: 5432,
  endpointType: "docker-service",
  endpointHost: "db",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validIpv4(value: string): boolean {
  const octets = value.split(".");
  return (
    octets.length === 4 &&
    octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
  );
}

function validDnsName(value: string): boolean {
  return (
    value.length <= 253 &&
    value.split(".").every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
    )
  );
}

export function parseDatabaseConfiguration(value: unknown): DatabaseConfiguration | null {
  if (!isRecord(value)) return null;

  const provider = value.provider;
  const storageType = value.storageType;
  const networkMode = value.networkMode;
  const region = value.region;
  const resourceName = value.resourceName;
  const databaseName = value.databaseName;
  const engineVersion = value.engineVersion;
  const instanceClass = value.instanceClass;
  const endpointType =
    value.endpointType === undefined ? "docker-service" : value.endpointType;
  const endpointHost =
    value.endpointHost === undefined
      ? provider === "docker-postgres17"
        ? "db"
        : ""
      : value.endpointHost;
  const storageGb = value.storageGb;
  const backupRetentionDays = value.backupRetentionDays;
  const multiAz = value.multiAz;
  const storageEncrypted = value.storageEncrypted;
  const deletionProtection = value.deletionProtection;
  const port = value.port;

  if (
    (endpointType !== "localhost" &&
      endpointType !== "ipv4" &&
      endpointType !== "dns" &&
      endpointType !== "docker-service") ||
    typeof endpointHost !== "string" ||
    typeof provider !== "string" ||
    !DATABASE_PROVIDERS.includes(provider as DatabaseProvider) ||
    (storageType !== "gp3" && storageType !== "io2") ||
    (networkMode !== "docker-internal" &&
      networkMode !== "private-subnets" &&
      networkMode !== "external-endpoint") ||
    (provider === "docker-postgres17" && networkMode !== "docker-internal") ||
    (provider.startsWith("external-") && networkMode !== "external-endpoint") ||
    (!provider.startsWith("external-") &&
      provider !== "docker-postgres17" &&
      networkMode !== "private-subnets") ||
    typeof region !== "string" ||
    !/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(region) ||
    typeof resourceName !== "string" ||
    !/^[A-Za-z][A-Za-z0-9-]{0,62}$/.test(resourceName) ||
    typeof databaseName !== "string" ||
    !/^[A-Za-z][A-Za-z0-9_]{0,62}$/.test(databaseName) ||
    typeof engineVersion !== "string" ||
    engineVersion.length < 1 ||
    engineVersion.length > 32 ||
    typeof instanceClass !== "string" ||
    !/^(db\.[a-z0-9.-]{3,30}|cache\.[a-z0-9.-]{3,30}|[a-z0-9.-]{3,30}\.search|serverless)$/.test(instanceClass) ||
    typeof storageGb !== "number" ||
    !Number.isInteger(storageGb) ||
    storageGb < 20 ||
    storageGb > 65536 ||
    typeof backupRetentionDays !== "number" ||
    !Number.isInteger(backupRetentionDays) ||
    backupRetentionDays < 0 ||
    backupRetentionDays > 35 ||
    typeof multiAz !== "boolean" ||
    typeof storageEncrypted !== "boolean" ||
    typeof deletionProtection !== "boolean" ||
    value.publicAccess !== false ||
    typeof port !== "number" ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    endpointHost.length > 253 ||
    (provider.startsWith("external-") &&
      (networkMode !== "external-endpoint" ||
        endpointHost.length === 0 ||
        (endpointType === "localhost" &&
          !["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(endpointHost)) ||
        (endpointType === "ipv4" && !validIpv4(endpointHost)) ||
        ((endpointType === "dns" || endpointType === "docker-service") &&
          !validDnsName(endpointHost))))
  ) {
    return null;
  }

  return {
    provider: provider as DatabaseProvider,
    region,
    resourceName,
    databaseName,
    engineVersion,
    instanceClass,
    storageGb,
    storageType,
    backupRetentionDays,
    multiAz,
    storageEncrypted,
    deletionProtection,
    publicAccess: false,
    networkMode,
    port,
    endpointType,
    endpointHost,
  };
}
