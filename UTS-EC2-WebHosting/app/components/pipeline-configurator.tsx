"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Boxes,
  CircleAlert,
  GitBranch,
  Info,
  Loader2,
  Plus,
  Rocket,
  Save,
  ServerCog,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import {
  DEFAULT_PIPELINE_CONFIGURATION,
  type PipelineConfiguration,
  type PipelineEnvironmentVariable,
} from "@/lib/pipeline";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  databaseOptionId: string;
};

const fieldClass =
  "mt-1.5 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-ring/60 focus:border-ring focus:ring-2 focus:ring-ring/20";
const labelClass = "block text-xs font-medium text-foreground";
const hintClass = "mt-1 block text-[10px] font-normal leading-5 text-muted-foreground";
const regions: Array<[string, string]> = [
  ["ap-southeast-3", "Asia Pacific (Jakarta)"],
  ["ap-southeast-1", "Asia Pacific (Singapore)"],
  ["ap-southeast-2", "Asia Pacific (Sydney)"],
  ["ap-northeast-1", "Asia Pacific (Tokyo)"],
  ["us-east-1", "US East (N. Virginia)"],
  ["us-west-2", "US West (Oregon)"],
];

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={id} className={labelClass}>
      {label}
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  hint?: string;
}) {
  return (
    <label htmlFor={id} className={labelClass}>
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        {options.map(([optionValue, text]) => (
          <option key={optionValue} value={optionValue}>
            {text}
          </option>
        ))}
      </select>
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </label>
  );
}

function ActionPanel({
  number,
  title,
  provider,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  provider: string;
  icon: typeof GitBranch;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-background font-mono text-[10px] font-semibold text-muted-foreground shadow-sm">
            {number}
          </span>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {title}
            </h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Pipeline action</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-background font-mono text-[9px]">
          {provider}
        </Badge>
      </div>
      <div className="grid gap-x-6 gap-y-5 p-4 sm:p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function RadioCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[78px] cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
        checked
          ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
          : "border-border bg-background hover:border-ring/60 hover:bg-muted/30",
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        <span className="block text-xs font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-[10px] leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function ArtifactField({
  id,
  label,
  artifacts,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  artifacts: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  const [draft, setDraft] = useState("");

  function addArtifact() {
    const artifact = draft.trim();
    if (!artifact || artifacts.includes(artifact)) return;
    onChange([...artifacts, artifact]);
    setDraft("");
  }

  return (
    <div className="md:col-span-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addArtifact();
            }
          }}
          placeholder="Masukkan nama artifact"
          className={cn(fieldClass, "mt-0")}
        />
        <Button type="button" variant="outline" onClick={addArtifact} className="shrink-0">
          <Plus />
          Tambah
        </Button>
      </div>
      <div className="mt-2 flex min-h-7 flex-wrap gap-2">
        {artifacts.map((artifact) => (
          <span
            key={artifact}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-mono text-[10px] text-sky-900"
          >
            {artifact}
            <button
              type="button"
              onClick={() => onChange(artifacts.filter((item) => item !== artifact))}
              aria-label={`Hapus artifact ${artifact}`}
              className="rounded-full p-0.5 text-sky-700 transition hover:bg-sky-100 hover:text-rose-700"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {artifacts.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">Belum ada artifact</span>
        ) : null}
      </div>
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

export default function PipelineConfigurator({ databaseOptionId }: Props) {
  const [configuration, setConfiguration] = useState(DEFAULT_PIPELINE_CONFIGURATION);
  const [savedConfiguration, setSavedConfiguration] = useState(
    DEFAULT_PIPELINE_CONFIGURATION,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [databaseStatus, setDatabaseStatus] = useState<"up" | "down" | "unknown">(
    "unknown",
  );

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [configResponse, healthResponse] = await Promise.all([
          fetch("/api/pipeline", { cache: "no-store" }),
          fetch("/api/health", { cache: "no-store" }),
        ]);
        const payload = (await configResponse.json()) as {
          configuration?: PipelineConfiguration;
          error?: string;
        };
        if (!configResponse.ok || !payload.configuration) {
          throw new Error(payload.error ?? "pipeline_unavailable");
        }
        const healthPayload = (await healthResponse.json()) as {
          db?: { status?: string };
        };
        if (active) {
          setConfiguration(payload.configuration);
          setSavedConfiguration(payload.configuration);
          setDatabaseStatus(healthPayload.db?.status === "up" ? "up" : "down");
          setError("");
        }
      } catch (loadError) {
        console.error("[pipeline-configurator] load failed:", loadError);
        if (active) setError("Konfigurasi pipeline gagal dimuat dari PostgreSQL.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(configuration) !== JSON.stringify(savedConfiguration),
    [configuration, savedConfiguration],
  );

  function updateSource(patch: Partial<PipelineConfiguration["source"]>) {
    setConfiguration((current) => ({
      ...current,
      source: { ...current.source, ...patch },
    }));
    setNotice("");
  }

  function updateBuild(patch: Partial<PipelineConfiguration["build"]>) {
    setConfiguration((current) => ({
      ...current,
      build: { ...current.build, ...patch },
    }));
    setNotice("");
  }

  function updateDeploy(patch: Partial<PipelineConfiguration["deploy"]>) {
    setConfiguration((current) => ({
      ...current,
      deploy: { ...current.deploy, ...patch },
    }));
    setNotice("");
  }

  function updateEnvironmentVariable(
    index: number,
    patch: Partial<PipelineEnvironmentVariable>,
  ) {
    const environmentVariables = configuration.build.environmentVariables.map(
      (variable, currentIndex) =>
        currentIndex === index ? { ...variable, ...patch } : variable,
    );
    updateBuild({ environmentVariables });
  }

  function addEnvironmentVariable() {
    updateBuild({
      environmentVariables: [
        ...configuration.build.environmentVariables,
        { name: "", value: "", type: "PLAINTEXT" },
      ],
    });
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuration }),
      });
      const payload = (await response.json()) as {
        configuration?: PipelineConfiguration;
        error?: string;
      };
      if (!response.ok || !payload.configuration) {
        throw new Error(payload.error ?? "save_failed");
      }
      setConfiguration(payload.configuration);
      setSavedConfiguration(payload.configuration);
      setNotice("Konfigurasi Source, Build, dan Deploy berhasil disimpan ke PostgreSQL.");
    } catch (saveError) {
      console.error("[pipeline-configurator] save failed:", saveError);
      setError("Konfigurasi belum tersimpan. Periksa input dan koneksi database.");
    } finally {
      setSaving(false);
    }
  }

  const isRds = databaseOptionId === "rds-postgres-private";

  return (
    <section id="pipeline" className="scroll-mt-24">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-start sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" className="gap-1.5">
                <GitBranch className="size-3" />
                Pipeline CI/CD
              </Badge>
              <Badge variant="outline" className="bg-background">
                <ShieldCheck className="size-3" />
                Tanpa AWS API
              </Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
              CodePipeline actions
            </h2>
            <p className="mt-1.5 max-w-3xl text-xs leading-6 text-muted-foreground">
              Lengkapi formulir Source, Build, dan Deploy seperti halaman Edit
              action AWS. Setiap field disimpan ke PostgreSQL dan bisa diedit
              kembali.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0 font-mono text-[10px]">
            {isRds ? "RDS PostgreSQL" : "Docker PostgreSQL · EC2"}
          </Badge>
        </div>

        <div className="p-4 sm:p-5 sm:pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <ServerCog className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-foreground">Database aplikasi</p>
                <p className="mt-0.5 max-w-2xl text-[10px] leading-5 text-muted-foreground">
                  Endpoint aktif diperiksa melalui DATABASE_URL. Pilihan Docker/RDS
                  pada checklist tidak mengubah koneksi database secara otomatis.
                </p>
              </div>
            </div>
            <Badge
              variant={
                databaseStatus === "up"
                  ? "success"
                  : databaseStatus === "down"
                    ? "destructive"
                    : "outline"
              }
              role="status"
              className="gap-1.5"
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  databaseStatus === "up"
                    ? "bg-emerald-500"
                    : databaseStatus === "down"
                      ? "bg-rose-500"
                      : "bg-muted-foreground",
                )}
              />
              {databaseStatus === "up"
                ? "PostgreSQL terhubung"
                : databaseStatus === "down"
                  ? "Database tidak terhubung"
                  : "Memeriksa database"}
            </Badge>
          </div>

          {error ? (
            <Alert variant="destructive" className="mt-4 py-3">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {notice ? (
            <Alert variant="success" className="mt-4 py-3">
              <BadgeCheck />
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}

          {loading ? (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat formulir dari PostgreSQL…
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <ActionPanel
                number="01"
                title={configuration.source.actionName || "Source"}
                provider={`CodeStar · ${configuration.source.provider}`}
                icon={GitBranch}
              >
                <TextField
                  id="source-action-name"
                  label="Action name"
                  value={configuration.source.actionName}
                  onChange={(actionName) => updateSource({ actionName })}
                  placeholder="Source"
                  hint="Pilih nama untuk action ini (maksimal 100 karakter)."
                />
                <SelectField
                  id="source-provider"
                  label="Action provider"
                  value={configuration.source.provider}
                  onChange={(value) =>
                    updateSource({
                      provider: value as PipelineConfiguration["source"]["provider"],
                    })
                  }
                  options={[
                    ["bitbucket", "Bitbucket"],
                    ["github", "GitHub (via CodeStar connection)"],
                  ]}
                />
                <div className="md:col-span-2">
                  <p className={labelClass}>Connection</p>
                  <p className={hintClass}>
                    Pilih nama koneksi yang sudah dibuat di AWS Developer Tools
                    settings. Token OAuth tidak disimpan dalam aplikasi ini.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      aria-label="Connection name"
                      value={configuration.source.connectionName}
                      onChange={(event) =>
                        updateSource({ connectionName: event.target.value })
                      }
                      placeholder="Pilih atau masukkan nama connection"
                      className={cn(fieldClass, "mt-0")}
                    />
                    <a
                      href="https://console.aws.amazon.com/codesuite/settings/connections"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-4 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
                    >
                      Connect to{" "}
                      {configuration.source.provider === "bitbucket"
                        ? "Bitbucket"
                        : "GitHub"}
                    </a>
                  </div>
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-950">
                    Status koneksi harus diperiksa di AWS Console. Mengisi nama di
                    sini tidak membuat atau menghubungkan AWS Connection.
                  </p>
                </div>
                <TextField
                  id="source-repository"
                  label="Repository name"
                  value={configuration.source.repository}
                  onChange={(repository) => updateSource({ repository })}
                  placeholder="workspace/repository"
                  hint="Untuk Bitbucket, gunakan format group/subgroup/project bila diperlukan."
                />
                <TextField
                  id="source-branch"
                  label="Branch name"
                  value={configuration.source.branch}
                  onChange={(branch) => updateSource({ branch })}
                  placeholder="main"
                />
                <div className="md:col-span-2">
                  <p className={labelClass}>Output artifact format</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <RadioCard
                      checked={
                        configuration.source.artifactFormat === "codepipeline-default"
                      }
                      onChange={() =>
                        updateSource({ artifactFormat: "codepipeline-default" })
                      }
                      title="CodePipeline default"
                      description="Format artifact default. Metadata Git tidak disertakan."
                    />
                    <RadioCard
                      checked={configuration.source.artifactFormat === "full-clone"}
                      onChange={() => updateSource({ artifactFormat: "full-clone" })}
                      title="Full clone"
                      description="Menyertakan metadata Git; hanya didukung action AWS CodeBuild."
                    />
                  </div>
                </div>
                <TextField
                  id="source-namespace"
                  label="Variable namespace · optional"
                  value={configuration.source.variableNamespace}
                  onChange={(variableNamespace) => updateSource({ variableNamespace })}
                  placeholder="SourceVariables"
                />
                <ArtifactField
                  id="source-artifacts"
                  label="Output artifacts"
                  artifacts={configuration.source.outputArtifacts}
                  onChange={(outputArtifacts) => updateSource({ outputArtifacts })}
                />
              </ActionPanel>

              <ActionPanel
                number="02"
                title={configuration.build.actionName || "Build"}
                provider="AWS CodeBuild"
                icon={Boxes}
              >
                <TextField
                  id="build-action-name"
                  label="Action name"
                  value={configuration.build.actionName}
                  onChange={(actionName) => updateBuild({ actionName })}
                  placeholder="Build"
                />
                <SelectField
                  id="build-region"
                  label="Region"
                  value={configuration.build.region}
                  onChange={(region) => updateBuild({ region })}
                  options={regions}
                />
                <ArtifactField
                  id="build-input-artifacts"
                  label="Input artifacts"
                  artifacts={configuration.build.inputArtifacts}
                  onChange={(inputArtifacts) => updateBuild({ inputArtifacts })}
                  hint="Pilih output artifact dari Source, misalnya SourceArtifact."
                />
                <TextField
                  id="build-project"
                  label="Project name"
                  value={configuration.build.projectName}
                  onChange={(projectName) => updateBuild({ projectName })}
                  placeholder="nextjsapp"
                  hint="Pilih project CodeBuild yang sudah dibuat di AWS Console."
                />
                <div className="md:col-span-2">
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-xs transition hover:border-ring/50">
                    <input
                      type="checkbox"
                      checked={configuration.build.overrideBuildspec}
                      onChange={(event) =>
                        updateBuild({ overrideBuildspec: event.target.checked })
                      }
                      className="mt-0.5 size-4 rounded border-border accent-primary"
                    />
                    <span>
                      <span className="block font-medium text-foreground">
                        Define buildspec override · optional
                      </span>
                      <span className={hintClass}>
                        Ganti buildspec project untuk eksekusi pipeline ini saja.
                      </span>
                    </span>
                  </label>
                  {configuration.build.overrideBuildspec ? (
                    <div className="mt-3">
                      <TextField
                        id="buildspec-path"
                        label="Buildspec path"
                        value={configuration.build.buildspecPath}
                        onChange={(buildspecPath) => updateBuild({ buildspecPath })}
                        placeholder="buildspec.yml"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="md:col-span-2">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className={labelClass}>Environment variables · optional</p>
                      <p className={hintClass}>
                        Untuk secret, isi nama parameter atau ARN Secrets Manager,
                        bukan nilai rahasianya.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEnvironmentVariable}
                      disabled={configuration.build.environmentVariables.length >= 30}
                    >
                      <Plus />
                      Tambah variable
                    </Button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {configuration.build.environmentVariables.map((variable, index) => (
                      <div
                        key={`env-${index}`}
                        className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-[1fr_1.2fr_180px_auto]"
                      >
                        <label className={labelClass}>
                          Key
                          <input
                            value={variable.name}
                            onChange={(event) =>
                              updateEnvironmentVariable(index, {
                                name: event.target.value,
                              })
                            }
                            placeholder="NODE_ENV"
                            className={fieldClass}
                          />
                        </label>
                        <label className={labelClass}>
                          Value / reference
                          <input
                            value={variable.value}
                            onChange={(event) =>
                              updateEnvironmentVariable(index, {
                                value: event.target.value,
                              })
                            }
                            placeholder={
                              variable.type === "PLAINTEXT"
                                ? "production"
                                : "arn:aws:secretsmanager:..."
                            }
                            className={fieldClass}
                          />
                        </label>
                        <SelectField
                          id={`env-type-${index}`}
                          label="Type"
                          value={variable.type}
                          onChange={(type) =>
                            updateEnvironmentVariable(index, {
                              type: type as PipelineEnvironmentVariable["type"],
                            })
                          }
                          options={[
                            ["PLAINTEXT", "Plaintext"],
                            ["PARAMETER_STORE", "Parameter Store"],
                            ["SECRETS_MANAGER", "Secrets Manager"],
                          ]}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateBuild({
                              environmentVariables:
                                configuration.build.environmentVariables.filter(
                                  (_, currentIndex) => currentIndex !== index,
                                ),
                            })
                          }
                          aria-label={`Hapus environment variable ${index + 1}`}
                          className="mt-5 h-10 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                    {configuration.build.environmentVariables.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-[11px] text-muted-foreground">
                        <Info className="size-3.5" />
                        Belum ada environment variable. Tambahkan jika diperlukan.
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className={labelClass}>Build type</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <RadioCard
                      checked={configuration.build.buildType === "single"}
                      onChange={() => updateBuild({ buildType: "single" })}
                      title="Single build"
                      description="Menjalankan satu build."
                    />
                    <RadioCard
                      checked={configuration.build.buildType === "batch"}
                      onChange={() => updateBuild({ buildType: "batch" })}
                      title="Batch build"
                      description="Menjalankan beberapa build sebagai satu eksekusi."
                    />
                  </div>
                </div>
                <TextField
                  id="build-namespace"
                  label="Variable namespace · optional"
                  value={configuration.build.variableNamespace}
                  onChange={(variableNamespace) => updateBuild({ variableNamespace })}
                  placeholder="BuildVariables"
                />
                <ArtifactField
                  id="build-output-artifacts"
                  label="Output artifacts"
                  artifacts={configuration.build.outputArtifacts}
                  onChange={(outputArtifacts) => updateBuild({ outputArtifacts })}
                />
              </ActionPanel>

              <ActionPanel
                number="03"
                title={configuration.deploy.actionName || "Deploy"}
                provider="AWS CodeDeploy"
                icon={Rocket}
              >
                <TextField
                  id="deploy-action-name"
                  label="Action name"
                  value={configuration.deploy.actionName}
                  onChange={(actionName) => updateDeploy({ actionName })}
                  placeholder="Deploy"
                />
                <SelectField
                  id="deploy-region"
                  label="Region"
                  value={configuration.deploy.region}
                  onChange={(region) => updateDeploy({ region })}
                  options={regions}
                />
                <ArtifactField
                  id="deploy-input-artifacts"
                  label="Input artifacts"
                  artifacts={configuration.deploy.inputArtifacts}
                  onChange={(inputArtifacts) => updateDeploy({ inputArtifacts })}
                  hint="Pilih output artifact dari Build, misalnya BuildArtifact."
                />
                <TextField
                  id="deploy-application"
                  label="Application name"
                  value={configuration.deploy.applicationName}
                  onChange={(applicationName) => updateDeploy({ applicationName })}
                  placeholder="next-js-app"
                  hint="Pilih aplikasi yang sudah terdaftar di AWS CodeDeploy."
                />
                <TextField
                  id="deploy-group"
                  label="Deployment group"
                  value={configuration.deploy.deploymentGroup}
                  onChange={(deploymentGroup) => updateDeploy({ deploymentGroup })}
                  placeholder="production-ec2"
                  hint="Deployment group harus cocok dengan aplikasi dan region."
                />
                <TextField
                  id="deploy-namespace"
                  label="Variable namespace · optional"
                  value={configuration.deploy.variableNamespace}
                  onChange={(variableNamespace) => updateDeploy({ variableNamespace })}
                  placeholder="DeployVariables"
                />
              </ActionPanel>

              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <Wrench className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="max-w-3xl text-[10px] leading-5 text-muted-foreground">
                    Konfigurasi ini disimpan ke database aplikasi. Ini belum membuat
                    CodePipeline atau resource AWS. Credential, koneksi, dan resource
                    harus disiapkan di AWS Console.
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={() => void save()}
                  className="shrink-0"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  {saving ? "Menyimpan…" : "Simpan konfigurasi"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
