import { DEFAULT_DATABASE_CONFIGURATION } from "@/lib/database-config";

export type SectionConfigValue = string | number | boolean;
export type SectionConfiguration = Record<string, SectionConfigValue>;

export type SectionField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "toggle" | "textarea" | "rules";
  defaultValue: SectionConfigValue;
  hint?: string;
  min?: number;
  max?: number;
  options?: Array<[string, string]>;
};

const field = (
  key: string,
  label: string,
  type: SectionField["type"],
  defaultValue: SectionConfigValue,
  options?: Array<[string, string]>,
  hint?: string,
  min?: number,
  max?: number,
): SectionField => ({ key, label, type, defaultValue, options, hint, min, max });

const defaultInboundRules = JSON.stringify([
  { protocol: "tcp", port: 80, source: "0.0.0.0/0", description: "HTTP web" },
  { protocol: "tcp", port: 443, source: "0.0.0.0/0", description: "HTTPS web" },
]);

export const SECTION_CONFIGURATION_FIELDS: Record<number, SectionField[]> = {
  1: [
    field("region", "AWS Region", "select", "ap-southeast-3", [
      ["ap-southeast-3", "Asia Pacific (Jakarta)"],
      ["ap-southeast-1", "Asia Pacific (Singapore)"],
      ["ap-southeast-2", "Asia Pacific (Sydney)"],
      ["ap-northeast-1", "Asia Pacific (Tokyo)"],
      ["us-east-1", "US East (N. Virginia)"],
      ["us-west-2", "US West (Oregon)"],
    ]),
    field("instanceType", "Instance type", "select", "t3.micro", [
      ["t3.micro", "t3.micro"],
      ["t3.small", "t3.small"],
      ["t3.medium", "t3.medium"],
      ["t4g.micro", "t4g.micro · Arm"],
      ["t4g.small", "t4g.small · Arm"],
    ]),
    field("ami", "Quick Start OS image", "select", "debian-13", [
      ["amazon-linux-2023", "Amazon Linux 2023"],
      ["debian-13", "Debian 13"],
      ["ubuntu-2404", "Ubuntu 24.04"],
      ["redhat-9", "Red Hat Enterprise Linux 9"],
      ["windows-2025", "Windows Server 2025"],
    ]),
    field("architecture", "Architecture", "select", "x86_64", [
      ["x86_64", "64-bit x86_64"],
      ["arm64", "64-bit Arm (Graviton)"],
    ]),
    field("amiId", "AMI ID (region-specific)", "text", "", undefined, "AMI ID harus tersedia di region yang dipilih; contoh pencarian lokal tidak memanggil AWS."),
    field("username", "Default login username", "text", "admin", undefined, "Debian: admin · Ubuntu: ubuntu · Amazon Linux: ec2-user."),
    field("keyPairName", "Key pair name", "text", "", undefined, "Pilih atau catat nama key pair; private key tidak disimpan."),
    field("keyPairType", "Key pair type", "select", "rsa", [
      ["rsa", "RSA"],
      ["ed25519", "ED25519"],
    ]),
    field("privateKeyFormat", "Private key file format", "select", "pem", [
      ["pem", ".pem · OpenSSH"],
      ["ppk", ".ppk · PuTTY"],
    ]),
    field("instanceCount", "Number of instances", "number", 1, undefined, "Jumlah rencana instance.", 1, 20),
    field("instanceName", "Instance name", "text", "ec2-lab-instance", undefined, "Name tag untuk tampilan Instances."),
    field("rootVolumeGiB", "Root volume (GiB)", "number", 20, undefined, "Ukuran catatan konfigurasi storage.", 8, 16384),
    field("elasticIp", "Rencanakan Elastic IP", "toggle", true),
    field("tags", "Additional tags (key=value per line)", "textarea", "Project=ec2-lab\nEnvironment=lab", undefined, "Tags adalah metadata; tidak membuat resource."),
  ],
  2: [
    field("adminAccess", "Administration method", "select", "ssm-only", [
      ["ssh-ip32", "SSH restricted to my IP (/32)"],
      ["ssm-only", "AWS Systems Manager (no public SSH)"],
    ]),
    field("adminCidr", "Admin IPv4 CIDR", "text", "", undefined, "Contoh 203.0.113.10/32; hanya catatan konfigurasi."),
    field("allowHttp", "Allow inbound HTTP :80", "toggle", true),
    field("allowHttps", "Allow inbound HTTPS :443", "toggle", true),
    field("publicAppPort", "Expose app :3000 publicly", "toggle", false, undefined, "Port aplikasi tetap privat."),
    field("publicDatabasePort", "Expose database publicly", "toggle", false, undefined, "Port database tetap privat."),
    field("securityGroupName", "Security group name", "text", "ec2-lab-web"),
    field("inboundRules", "Inbound rules", "rules", defaultInboundRules, undefined, "Rule SSH harus dibatasi ke IP admin /32. Jangan tambahkan 3000 atau port database."),
  ],
  3: [
    field("operatingSystem", "Operating system", "select", "debian-13", [
      ["debian-13", "Debian 13"],
      ["ubuntu-2404", "Ubuntu 24.04"],
    ]),
    field("dockerEngine", "Docker Engine", "toggle", true),
    field("composeVersion", "Docker Compose", "select", "v2", [["v2", "Compose v2"]]),
    field("git", "Install Git", "toggle", true),
    field("swapGiB", "Swap size (GiB)", "number", 2, undefined, "Swap yang direncanakan untuk instance.", 0, 64),
    field("appDirectory", "Application directory", "text", "/opt/app"),
  ],
  4: [],
  5: [
    field("proxy", "Reverse proxy", "select", "nginx", [["nginx", "Nginx"]]),
    field("tlsMode", "TLS configuration", "select", "letsencrypt", [
      ["letsencrypt", "Let's Encrypt"],
      ["http-smoke-test", "HTTP smoke test only"],
    ]),
    field("domain", "Application domain", "text", "", undefined, "Contoh app.example.com."),
    field("redirectHttpToHttps", "Redirect HTTP to HTTPS", "toggle", true),
    field("gzip", "Enable gzip compression", "toggle", true),
    field("securityHeaders", "Enable security headers", "toggle", true),
    field("upstreamPort", "Private app upstream port", "number", 3000, undefined, "Tidak dipublikasikan di Security Group.", 1, 65535),
  ],
  6: [
    field("dnsProvider", "DNS provider", "select", "route53", [
      ["route53", "Amazon Route 53"],
      ["external-dns", "External DNS provider"],
    ]),
    field("domain", "Application domain", "text", "", undefined, "Contoh app.example.com."),
    field("recordType", "DNS record type", "select", "A", [["A", "A record"]]),
    field("originAddress", "Elastic IP address", "text", "", undefined, "Alamat IP dicatat saja; tidak ada alamat yang dialokasikan."),
    field("ttlSeconds", "DNS TTL (seconds)", "number", 300, undefined, "Nilai rencana record DNS.", 60, 86400),
    field("certificateEmail", "Certificate renewal email", "text", ""),
  ],
  7: [
    field("iacTool", "Infrastructure as Code", "select", "terraform", [
      ["terraform", "Terraform"],
      ["opentofu", "OpenTofu"],
      ["console", "AWS Console (learning notes)"],
    ]),
    field("stateBackend", "State backend", "select", "local", [
      ["local", "Local state (lab)"],
      ["s3", "S3 backend (planned)"],
    ]),
    field("workspace", "Workspace name", "text", "dev"),
    field("region", "Target region", "select", "ap-southeast-3", [
      ["ap-southeast-3", "Asia Pacific (Jakarta)"],
      ["ap-southeast-1", "Asia Pacific (Singapore)"],
    ]),
    field("requireReview", "Require manual plan review", "toggle", true),
    field("automaticApply", "Run apply automatically", "toggle", false, undefined, "Tetap nonaktif; aplikasi tidak menjalankan IaC."),
  ],
  8: [
    field("platform", "CI/CD platform", "select", "github-actions", [
      ["github-actions", "GitHub Actions"],
      ["codepipeline", "AWS CodePipeline"],
      ["gitlab", "GitLab CI/CD"],
      ["jenkins", "Jenkins"],
    ]),
    field("repository", "Repository", "text", "", undefined, "Format owner/repository; token tidak disimpan."),
    field("branch", "Deployment branch", "text", "main"),
    field("imageRegistry", "Container registry", "select", "ghcr", [
      ["ghcr", "GitHub Container Registry"],
      ["ecr", "Amazon ECR"],
    ]),
    field("deploymentTarget", "Deployment target", "select", "ec2", [
      ["ec2", "Single EC2 instance"],
      ["eks", "Amazon EKS (planned)"],
    ]),
    field("healthCheckPath", "Health check path", "text", "/api/health"),
    field("rollbackEnabled", "Record rollback strategy", "toggle", true),
  ],
  9: [
    field("platform", "Container platform", "select", "single-vm", [
      ["single-vm", "Keep one EC2 VM"],
      ["eks", "Amazon EKS"],
    ]),
    field("clusterName", "Cluster name", "text", "ec2-lab"),
    field("chartName", "Helm chart", "text", "nextjs-app"),
    field("replicas", "Desired replicas", "number", 2, undefined, "Nilai rencana workload.", 1, 100),
    field("autoscaling", "Plan horizontal autoscaling", "toggle", false),
    field("minimumReplicas", "Minimum replicas", "number", 2, undefined, undefined, 1, 100),
    field("maximumReplicas", "Maximum replicas", "number", 4, undefined, undefined, 1, 100),
  ],
};

export function defaultSectionConfiguration(stepId: number): SectionConfiguration | null {
  if (stepId === 4) return { ...DEFAULT_DATABASE_CONFIGURATION };
  const fields = SECTION_CONFIGURATION_FIELDS[stepId];
  if (!fields) return null;
  return Object.fromEntries(fields.map(({ key, defaultValue }) => [key, defaultValue]));
}

function validIpv4(value: string): boolean {
  const octets = value.split(".");
  return (
    octets.length === 4 &&
    octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
  );
}

function validDomain(value: string): boolean {
  if (!value) return true;
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

function validInboundRules(value: string): boolean {
  let rules: unknown;
  try {
    rules = JSON.parse(value);
  } catch {
    return false;
  }
  if (!Array.isArray(rules) || rules.length > 30) return false;

  return rules.every((rule) => {
    if (
      rule === null ||
      typeof rule !== "object" ||
      (rule.protocol !== "tcp" && rule.protocol !== "udp") ||
      !Number.isInteger(rule.port) ||
      rule.port < 1 ||
      rule.port > 65535 ||
      typeof rule.source !== "string" ||
      typeof rule.description !== "string" ||
      rule.description.length > 100
    ) {
      return false;
    }
    if (rule.source === "") return false;

    const [address, prefix, extra] = rule.source.split("/");
    const validCidr =
      extra === undefined &&
      prefix !== undefined &&
      /^\d{1,2}$/.test(prefix) &&
      Number(prefix) <= 32 &&
      validIpv4(address);
    const validSecurityGroup = /^sg-[a-f0-9]{8,17}$/.test(rule.source);
    if (!validCidr && !validSecurityGroup) return false;

    const publicSource = validCidr && Number(prefix) === 0;
    if (rule.port === 22 && (!validCidr || Number(prefix) !== 32)) return false;
    if (publicSource && rule.port !== 80 && rule.port !== 443) {
      return false;
    }
    return true;
  });
}

export function parseSectionConfiguration(
  stepId: number,
  value: unknown,
): SectionConfiguration | null {
  if (stepId === 4) return null;
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const fields = SECTION_CONFIGURATION_FIELDS[stepId];
  if (!fields) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== fields.length) return null;

  for (const definition of fields) {
    const candidate = record[definition.key];
    if (definition.type === "toggle") {
      if (typeof candidate !== "boolean") return null;
      if (
        (definition.key === "publicAppPort" ||
          definition.key === "publicDatabasePort" ||
          definition.key === "automaticApply") &&
        candidate
      ) {
        return null;
      }
    } else if (definition.type === "number") {
      if (
        typeof candidate !== "number" ||
        !Number.isInteger(candidate) ||
        candidate < (definition.min ?? Number.MIN_SAFE_INTEGER) ||
        candidate > (definition.max ?? Number.MAX_SAFE_INTEGER)
      ) {
        return null;
      }
    } else if (typeof candidate !== "string" || candidate.length > 4096) {
      return null;
    } else if (
      definition.type === "select" &&
      !definition.options?.some(([optionValue]) => optionValue === candidate)
    ) {
      return null;
    } else if (
      definition.type === "rules" &&
      !validInboundRules(candidate)
    ) {
      return null;
    }

    if (typeof candidate === "string") {
      if (
        (definition.key === "adminCidr" &&
          candidate !== "" &&
          (!candidate.endsWith("/32") ||
            !validIpv4(candidate.slice(0, -3)))) ||
        (definition.key === "originAddress" &&
          candidate !== "" &&
          !validIpv4(candidate)) ||
        (definition.key === "domain" && !validDomain(candidate)) ||
        (definition.key === "certificateEmail" &&
          candidate !== "" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) ||
        (definition.key === "keyPairName" &&
          candidate !== "" &&
          !/^[A-Za-z0-9._-]{1,255}$/.test(candidate)) ||
        (definition.key === "appDirectory" &&
          (!candidate.startsWith("/") ||
            candidate.includes("..") ||
            candidate.includes("//"))) ||
        (definition.key === "repository" &&
          candidate !== "" &&
          !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(candidate)) ||
        (definition.key === "healthCheckPath" &&
          (!candidate.startsWith("/") || /\s/.test(candidate)))
      ) {
        return null;
      }
    }
  }

  if (stepId === 1) {
    const amiId = record.amiId;
    const tags = record.tags;
    if (
      (typeof amiId === "string" &&
        amiId !== "" &&
        !/^ami-[0-9a-f]{8,17}$/i.test(amiId)) ||
      typeof tags !== "string" ||
      tags.split(/\r?\n/).some((line) => line && !/^[^=\r\n]{1,128}=.{0,256}$/.test(line))
    ) {
      return null;
    }
  }
  if (stepId === 2) {
    let rules: unknown;
    try {
      rules = JSON.parse(String(record.inboundRules));
    } catch {
      return null;
    }
    if (
      record.adminAccess === "ssh-ip32" &&
      (typeof record.adminCidr !== "string" ||
        !/^(?:\d{1,3}\.){3}\d{1,3}\/32$/.test(record.adminCidr) ||
        !validIpv4(record.adminCidr.slice(0, -3)) ||
        !Array.isArray(rules) ||
        !rules.some(
          (rule) =>
            rule.port === 22 &&
            rule.source === record.adminCidr &&
            rule.protocol === "tcp",
        ))
    ) {
      return null;
    }
  }
  return record as SectionConfiguration;
}
