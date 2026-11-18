"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Cloud,
  Database,
  GitBranch,
  LayoutDashboard,
  Loader2,
  LogOut,
  Network,
  Save,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AppUser, DeploymentProgress } from "@/lib/db";
import { LAB_STEPS } from "@/lib/lab";
import PipelineConfigurator from "@/components/pipeline-configurator";
import DatabaseWorkspace from "@/components/database-workspace";
import { Brand } from "@/components/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DATABASE_PROVIDER_CHECKLIST_OPTIONS,
  type DatabaseConfiguration,
} from "@/lib/database-config";
import {
  defaultSectionConfiguration,
  SECTION_CONFIGURATION_FIELDS,
  type SectionConfigValue,
  type SectionConfiguration,
} from "@/lib/section-config";

type DashboardProps = {
  user: AppUser;
};

type Draft = {
  selectedOptionId: string;
  completed: boolean;
  configuration: SectionConfiguration;
};

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-ring/60 focus:border-ring focus:ring-2 focus:ring-ring/20";

function SectionConfigEditor({
  stepId,
  configuration,
  onChange,
}: {
  stepId: number;
  configuration: SectionConfiguration;
  onChange: (key: string, value: SectionConfigValue) => void;
}) {
  const fields = SECTION_CONFIGURATION_FIELDS[stepId] ?? [];
  const editorFields = fields.filter(
    (field) => stepId !== 1 || field.key !== "ami",
  );
  const [amiSearch, setAmiSearch] = useState("");
  const [recentAmis, setRecentAmis] = useState<string[]>([]);

  if (stepId === 4) {
    return (
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs leading-5 text-sky-900">
        <Database className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Detail engine, region, kapasitas, jaringan, dan backup untuk tahap ini
          tersimpan dari Database workspace.
        </p>
      </div>
    );
  }

  const amiField = fields.find((field) => field.key === "ami");
  const visibleAmis =
    amiField?.options?.filter(([value, label]) =>
      `${value} ${label}`.toLowerCase().includes(amiSearch.trim().toLowerCase()),
    ) ?? [];

  function applyQuickStart(ami: string) {
    onChange("ami", ami);
    setRecentAmis((current) =>
      [ami, ...current.filter((item) => item !== ami)].slice(0, 4),
    );
    onChange(
      "username",
      ami === "ubuntu-2404"
        ? "ubuntu"
        : ami.startsWith("amazon-linux")
          ? "ec2-user"
          : ami.startsWith("windows")
            ? "Administrator"
            : "admin",
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
      {stepId === 1 && amiField ? (
        <div className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">
              Application and OS Images (AMI)
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">
              Quick Start · 64-bit
            </span>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Cari katalog AMI</span>
            <input
              value={amiSearch}
              onChange={(event) => setAmiSearch(event.target.value)}
              placeholder="Search Quick Start OS images"
              className={cn(fieldClass, "mt-0")}
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {visibleAmis.map(([ami, label]) => (
              <button
                key={ami}
                type="button"
                onClick={() => applyQuickStart(ami)}
                className={cn(
                  "min-h-12 rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition",
                  configuration.ami === ami
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-ring hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
            {visibleAmis.length === 0 ? (
              <p className="col-span-full py-3 text-xs text-muted-foreground">
                Tidak ada OS Quick Start yang cocok dengan pencarian.
              </p>
            ) : null}
          </div>
          {recentAmis.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                Recent:
              </span>
              {recentAmis.map((ami) => (
                <button
                  key={ami}
                  type="button"
                  onClick={() => applyQuickStart(ami)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  {amiField.options?.find(([value]) => value === ami)?.[1] ?? ami}
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            AMI ID berbeda menurut region dan arsitektur. Pencarian ini adalah
            katalog referensi lokal, bukan API AWS live.
          </p>
        </div>
      ) : null}

      {stepId === 2 ? (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          Port 22 wajib dibatasi ke IP admin /32. Akses web publik hanya melalui
          80/443; port 3000 dan port database tidak diizinkan.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {editorFields.map((field) => {
          const value = configuration[field.key] ?? field.defaultValue;
          const locked =
            (field.key === "publicAppPort" ||
              field.key === "publicDatabasePort" ||
              field.key === "automaticApply") &&
            value === false;

          if (field.type === "toggle") {
            return (
              <label
                key={field.key}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-background p-3 text-xs transition hover:border-ring/50"
              >
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  disabled={locked}
                  onChange={(event) => onChange(field.key, event.target.checked)}
                  className="mt-0.5 size-4 rounded border-border accent-primary"
                />
                <span>
                  <span className="block font-medium text-foreground">
                    {field.label}
                  </span>
                  {field.hint ? (
                    <span className="mt-1 block leading-5 text-muted-foreground">
                      {field.hint}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          }

          if (field.type === "rules") {
            let rules: Array<{
              protocol: "tcp" | "udp";
              port: number;
              source: string;
              description: string;
            }> = [];
            try {
              const parsed: unknown = JSON.parse(String(value));
              if (Array.isArray(parsed)) rules = parsed;
            } catch (parseError) {
              console.error(
                "[deployment-dashboard] invalid inbound rules draft:",
                parseError,
              );
            }
            const updateRule = (
              index: number,
              patch: Partial<(typeof rules)[number]>,
            ) => {
              onChange(
                field.key,
                JSON.stringify(
                  rules.map((rule, ruleIndex) =>
                    ruleIndex === index ? { ...rule, ...patch } : rule,
                  ),
                ),
              );
            };
            return (
              <div key={field.key} className="min-w-0 sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {field.label}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rules.length >= 30}
                    onClick={() =>
                      onChange(
                        field.key,
                        JSON.stringify([
                          ...rules,
                          {
                            protocol: "tcp",
                            port: 8080,
                            source: "",
                            description: "Custom rule",
                          },
                        ]),
                      )
                    }
                  >
                    Add rule
                  </Button>
                </div>
                <div className="mt-2 min-w-0 overflow-x-auto rounded-lg border border-border bg-background">
                  <table className="w-full min-w-[690px] text-left text-xs">
                    <thead className="bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Port</th>
                        <th className="px-3 py-2 font-medium">Source CIDR</th>
                        <th className="px-3 py-2 font-medium">Description</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule, index) => (
                        <tr
                          key={`${rule.port}-${index}`}
                          className="border-t border-border"
                        >
                          <td className="px-2 py-2">
                            <select
                              value={`${rule.protocol}-${rule.port}`}
                              onChange={(event) => {
                                const [protocol, port] = event.target.value.split("-");
                                updateRule(index, {
                                  protocol: protocol as "tcp" | "udp",
                                  port: Number(port),
                                });
                              }}
                              className={cn(fieldClass, "mt-0 h-9")}
                            >
                              <option value="tcp-22">SSH · TCP</option>
                              <option value="tcp-80">HTTP · TCP</option>
                              <option value="tcp-443">HTTPS · TCP</option>
                              <option value="tcp-3000">
                                Custom TCP :3000 (private only)
                              </option>
                              <option value={`tcp-${rule.port}`}>
                                Custom TCP :{rule.port}
                              </option>
                              <option value={`udp-${rule.port}`}>
                                Custom UDP :{rule.port}
                              </option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              max={65535}
                              value={rule.port}
                              onChange={(event) =>
                                updateRule(index, { port: Number(event.target.value) })
                              }
                              className={cn(fieldClass, "mt-0 h-9 w-24")}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={rule.source}
                              onChange={(event) =>
                                updateRule(index, { source: event.target.value })
                              }
                              placeholder={
                                rule.port === 22 ? "Your IPv4 /32" : "0.0.0.0/0"
                              }
                              className={cn(fieldClass, "mt-0 h-9")}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={rule.description}
                              onChange={(event) =>
                                updateRule(index, { description: event.target.value })
                              }
                              className={cn(fieldClass, "mt-0 h-9")}
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onChange(
                                  field.key,
                                  JSON.stringify(
                                    rules.filter(
                                      (_, ruleIndex) => ruleIndex !== index,
                                    ),
                                  ),
                                )
                              }
                              aria-label={`Delete inbound rule ${rule.port}`}
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {field.hint ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">{field.hint}</p>
                ) : null}
              </div>
            );
          }

          return (
            <label key={field.key} className="block text-xs font-medium text-foreground">
              {field.label}
              {field.type === "select" ? (
                <select
                  value={String(value)}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className={fieldClass}
                >
                  {field.options?.map(([optionValue, label]) => (
                    <option key={optionValue} value={optionValue}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={String(value)}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  rows={4}
                  className={cn(fieldClass, "h-auto py-2.5 font-mono")}
                />
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  min={field.type === "number" ? field.min : undefined}
                  max={field.type === "number" ? field.max : undefined}
                  value={String(value)}
                  onChange={(event) =>
                    onChange(
                      field.key,
                      field.type === "number"
                        ? Number(event.target.value)
                        : event.target.value,
                    )
                  }
                  className={fieldClass}
                />
              )}
              {field.hint ? (
                <span className="mt-1 block font-normal leading-5 text-muted-foreground">
                  {field.hint}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      {stepId === 1 ? (
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <h4 className="text-sm font-semibold text-foreground">Launch summary</h4>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Number of instances", configuration.instanceCount],
              [
                "Software image (AMI)",
                configuration.amiId ||
                  `${configuration.ami} · select AMI ID for region`,
              ],
              ["Architecture", configuration.architecture],
              ["Instance type", configuration.instanceType],
              ["Key pair", configuration.keyPairName || "Not selected"],
              ["Firewall (security group)", "Inbound rules configured below"],
              ["Storage (volumes)", `1 × ${configuration.rootVolumeGiB} GiB`],
              ["Instance name", configuration.instanceName],
            ].map(([label, value]) => (
              <div key={String(label)} className="border-l-2 border-border pl-3">
                <dt className="text-[10px] text-muted-foreground">{String(label)}</dt>
                <dd className="mt-1 break-words font-medium text-foreground">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export default function DeploymentDashboard({ user }: DashboardProps) {
  const [progress, setProgress] = useState<Record<number, Draft>>({});
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingStep, setSavingStep] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/deployment", { cache: "no-store" });
        const payload = (await response.json()) as {
          progress?: DeploymentProgress[];
          configurations?: Array<{
            step_id: number;
            configuration: SectionConfiguration;
          }>;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "deployment_unavailable");
        }
        const configurationByStep = Object.fromEntries(
          (payload.configurations ?? []).map((item) => [
            item.step_id,
            item.configuration,
          ]),
        );
        const loaded = Object.fromEntries(
          (payload.progress ?? []).map((item) => {
            const configuration =
              configurationByStep[item.step_id] ??
              defaultSectionConfiguration(item.step_id) ??
              {};
            return [
              item.step_id,
              {
                selectedOptionId: item.selected_option_id,
                completed: item.completed,
                configuration,
              },
            ];
          }),
        );
        if (active) {
          setProgress(loaded);
          setDrafts(loaded);
          setError("");
        }
      } catch (loadError) {
        console.error("[deployment-dashboard] load failed:", loadError);
        if (active)
          setError(
            "Checklist gagal dimuat dari PostgreSQL. Coba muat ulang halaman.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const completedCount = useMemo(
    () => Object.values(progress).filter((item) => item.completed).length,
    [progress],
  );
  const percent = Math.round((completedCount / LAB_STEPS.length) * 100);
  const nextStep = LAB_STEPS.find((step) => !progress[step.id]?.completed);

  function updateDraft(stepId: number, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [stepId]: { ...current[stepId], ...patch },
    }));
    setNotice("");
  }

  function updateSectionConfiguration(
    stepId: number,
    key: string,
    value: SectionConfigValue,
  ) {
    setDrafts((current) => {
      const currentConfiguration =
        current[stepId]?.configuration ??
        defaultSectionConfiguration(stepId) ??
        {};
      let nextConfiguration = { ...currentConfiguration, [key]: value };
      if (stepId === 1 && key === "instanceType" && typeof value === "string") {
        nextConfiguration.architecture = value.startsWith("t4g.")
          ? "arm64"
          : "x86_64";
      }
      if (
        stepId === 2 &&
        ["adminAccess", "adminCidr", "allowHttp", "allowHttps"].includes(key)
      ) {
        try {
          const rules = JSON.parse(
            String(currentConfiguration.inboundRules ?? "[]"),
          ) as Array<{
            protocol: "tcp" | "udp";
            port: number;
            source: string;
            description: string;
          }>;
          const sourceIp = String(
            key === "adminCidr" ? value : (currentConfiguration.adminCidr ?? ""),
          );
          let nextRules = rules;
          if (key === "adminAccess") {
            nextRules =
              value === "ssm-only"
                ? rules.filter((rule) => rule.port !== 22)
                : rules.some((rule) => rule.port === 22)
                  ? rules
                  : [
                      ...rules,
                      {
                        protocol: "tcp",
                        port: 22,
                        source: sourceIp,
                        description: "SSH admin only",
                      },
                    ];
          } else if (key === "adminCidr") {
            nextRules = rules.map((rule) =>
              rule.port === 22 ? { ...rule, source: sourceIp } : rule,
            );
          } else if (key === "allowHttp") {
            nextRules =
              value === true
                ? rules.some((rule) => rule.port === 80)
                  ? rules
                  : [
                      ...rules,
                      {
                        protocol: "tcp",
                        port: 80,
                        source: "0.0.0.0/0",
                        description: "HTTP web",
                      },
                    ]
                : rules.filter((rule) => rule.port !== 80);
          } else if (key === "allowHttps") {
            nextRules =
              value === true
                ? rules.some((rule) => rule.port === 443)
                  ? rules
                  : [
                      ...rules,
                      {
                        protocol: "tcp",
                        port: 443,
                        source: "0.0.0.0/0",
                        description: "HTTPS web",
                      },
                    ]
                : rules.filter((rule) => rule.port !== 443);
          }
          nextConfiguration = {
            ...nextConfiguration,
            inboundRules: JSON.stringify(nextRules),
          };
        } catch (parseError) {
          console.error(
            "[deployment-dashboard] invalid network rules draft:",
            parseError,
          );
        }
      }
      return {
        ...current,
        [stepId]: {
          ...current[stepId],
          ...(stepId === 2 && key === "adminAccess" && typeof value === "string"
            ? { selectedOptionId: value }
            : {}),
          configuration: nextConfiguration,
        },
      };
    });
    setNotice("");
  }

  async function saveStep(stepId: number) {
    const draft = drafts[stepId];
    if (!draft || savingStep !== null) return;

    setSavingStep(stepId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/deployment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          selectedOptionId: draft.selectedOptionId,
          completed: draft.completed,
          ...(stepId === 4 ? {} : { configuration: draft.configuration }),
        }),
      });
      const payload = (await response.json()) as {
        progress?: DeploymentProgress;
        configuration?: SectionConfiguration | null;
        error?: string;
      };
      if (!response.ok || !payload.progress) {
        throw new Error(payload.error ?? "save_failed");
      }
      const saved = {
        selectedOptionId: payload.progress.selected_option_id,
        completed: payload.progress.completed,
        configuration: payload.configuration ?? draft.configuration,
      };
      setProgress((current) => ({ ...current, [stepId]: saved }));
      setDrafts((current) => ({ ...current, [stepId]: saved }));
      setNotice("Konfigurasi dan status bagian berhasil disimpan ke PostgreSQL.");
    } catch (saveError) {
      console.error("[deployment-dashboard] save failed:", saveError);
      setError(
        "Perubahan belum tersimpan. Periksa koneksi database lalu coba lagi.",
      );
    } finally {
      setSavingStep(null);
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout_failed");
      window.location.assign("/");
    } catch (logoutError) {
      console.error("[deployment-dashboard] logout failed:", logoutError);
      setError("Tidak dapat keluar saat ini. Coba lagi.");
    }
  }

  function syncSavedDatabaseProvider(configuration: DatabaseConfiguration) {
    const selectedOptionId =
      DATABASE_PROVIDER_CHECKLIST_OPTIONS[configuration.provider];
    const current = progress[4] ?? {
      selectedOptionId,
      completed: false,
      configuration,
    };
    const saved = { ...current, selectedOptionId, configuration };
    setProgress((items) => ({ ...items, 4: saved }));
    setDrafts((items) => ({ ...items, 4: saved }));
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Brand compact />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <LayoutDashboard className="size-3.5" />
              Workspace
              <ChevronRight className="size-3" />
              <span className="font-medium text-foreground">EC2 deployment</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/guide"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              <BookOpen className="size-3.5" />
              Panduan
            </Link>
            <span className="hidden h-6 w-px bg-border sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-semibold text-primary-foreground">
                {user.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("")}
              </span>
              <span className="max-w-[140px] truncate text-xs font-medium text-foreground">
                {user.name}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="text-muted-foreground hover:text-rose-600"
            >
              <LogOut />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <section id="overview" className="scroll-mt-24">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Badge variant="brand">
                <Cloud className="size-3" />
                EC2 deployment workspace
              </Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Halo, {user.name}.
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                Kelola resource, database, dan pipeline dalam satu workspace.
                Konfigurasi tersimpan per akun di PostgreSQL.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/guide#checklist">
                <Button variant="outline">
                  <BookOpen />
                  Buka panduan
                </Button>
              </Link>
              <a href="#checklist">
                <Button>
                  Lanjut ke checklist
                  <ArrowRight />
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="gap-0 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Progres lab
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {completedCount}/{LAB_STEPS.length}
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{percent}%</p>
              <Progress value={percent} className="mt-2" indicatorClassName="bg-brand" />
            </Card>
            <Card className="gap-0 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Terverifikasi
                </p>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {completedCount}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {LAB_STEPS.length} tahap
                </span>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {LAB_STEPS.length - completedCount} tahap tersisa
              </p>
            </Card>
            <Card className="gap-0 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Tahap berikutnya
                </p>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-2 truncate text-sm font-semibold">
                {nextStep ? nextStep.title : "Semua tahap selesai"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {nextStep
                  ? `Tahap ${String(nextStep.id).padStart(2, "0")} dari 09`
                  : "Siap merencanakan rilis"}
              </p>
            </Card>
            <Card className="gap-0 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Penyimpanan
                </p>
                <Database className="size-4 text-sky-600" />
              </div>
              <p className="mt-2 text-sm font-semibold">PostgreSQL</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tersimpan per akun · tanpa AWS API
              </p>
            </Card>
          </div>
        </section>

        <nav
          aria-label="Bagian workspace"
          className="scrollbar-thin mt-6 flex gap-1 overflow-x-auto border-b border-border"
        >
          {[
            ["#overview", "Overview", LayoutDashboard],
            ["#database", "Database", Database],
            ["#pipeline", "Pipeline", GitBranch],
            ["#checklist", "EC2 checklist", Server],
          ].map(([href, label, Icon]) => {
            const IconComponent = Icon as typeof LayoutDashboard;
            return (
              <a
                key={String(href)}
                href={String(href)}
                className="inline-flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-3 text-xs font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
              >
                <IconComponent className="size-3.5" />
                {String(label)}
              </a>
            );
          })}
        </nav>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="top-20 hidden rounded-xl border border-border bg-card p-3 shadow-sm lg:sticky lg:block">
            <p className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Workspace
            </p>
            <div className="space-y-0.5">
              <a
                href="#overview"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground transition hover:bg-accent"
              >
                <LayoutDashboard className="size-3.5 text-muted-foreground" />
                Overview
              </a>
              <a
                href="#database"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Database className="size-3.5" />
                Database workspace
              </a>
              <a
                href="#pipeline"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <GitBranch className="size-3.5" />
                Pipeline actions
              </a>
              <a
                href="#checklist"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Server className="size-3.5" />
                EC2 checklist
              </a>
            </div>

            <div className="my-3 h-px bg-border" />

            <p className="px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              EC2 resources
            </p>
            <div className="space-y-0.5">
              {LAB_STEPS.map((step) => (
                <a
                  key={step.id}
                  href={`#step-${step.id}`}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <span className="font-mono text-[9px] text-muted-foreground/70">
                    {String(step.id).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{step.title}</span>
                  {progress[step.id]?.completed ? (
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-emerald-600"
                      aria-label="Terverifikasi"
                    />
                  ) : (
                    <Circle className="size-3 shrink-0 text-border" aria-hidden="true" />
                  )}
                </a>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-[10px] leading-5 text-sky-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="size-3" />
                Catatan
              </div>
              <p className="mt-1">
                Simpan konfigurasi hanya mencatat pilihan ke PostgreSQL. Tidak ada
                provisioning atau perubahan resource AWS.
              </p>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {notice ? (
              <Alert variant="success">
                <CheckCircle2 />
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            ) : null}

            <DatabaseWorkspace onProviderSaved={syncSavedDatabaseProvider} />

            <PipelineConfigurator
              databaseOptionId={
                progress[4]?.selectedOptionId ??
                drafts[4]?.selectedOptionId ??
                LAB_STEPS.find((step) => step.id === 4)!.recommendedOptionId
              }
            />

            <section id="checklist" className="scroll-mt-24">
              <div className="mb-4 flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Infrastructure checklist
                  </p>
                  <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
                    EC2 deployment stages
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sembilan bagian bisa dibuka dari menu kiri. Pilihan tahap 04
                    mengikuti konfigurasi database di atas.
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {completedCount} / {LAB_STEPS.length} terverifikasi
                </Badge>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Memuat checklist dari PostgreSQL…
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {LAB_STEPS.map((step) => {
                    const saved = progress[step.id];
                    const draft = drafts[step.id];
                    const dirty =
                      saved?.selectedOptionId !== draft?.selectedOptionId ||
                      saved?.completed !== draft?.completed ||
                      JSON.stringify(saved?.configuration) !==
                        JSON.stringify(draft?.configuration);
                    return (
                      <article
                        key={step.id}
                        id={`step-${step.id}`}
                        className={cn(
                          "min-w-0 scroll-mt-24 rounded-xl border bg-card p-5 shadow-sm transition",
                          saved?.completed
                            ? "border-emerald-200 ring-1 ring-emerald-100"
                            : "border-border",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-semibold",
                                saved?.completed
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-border bg-muted text-muted-foreground",
                              )}
                            >
                              {String(step.id).padStart(2, "0")}
                            </span>
                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                {step.category}
                              </p>
                              <h3 className="mt-1 text-sm font-semibold text-foreground">
                                {step.title}
                              </h3>
                            </div>
                          </div>
                          {saved?.completed ? (
                            <Badge variant="success" className="shrink-0">
                              <CheckCircle2 className="size-3" />
                              Terverifikasi
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-4 text-xs leading-6 text-muted-foreground">
                          {step.description}
                        </p>

                        <label
                          htmlFor={`choice-${step.id}`}
                          className="mt-4 block text-[11px] font-medium text-foreground"
                        >
                          Pilihan konfigurasi
                        </label>
                        <select
                          id={`choice-${step.id}`}
                          value={draft?.selectedOptionId ?? step.recommendedOptionId}
                          onChange={(event) =>
                            updateDraft(step.id, {
                              selectedOptionId: event.target.value,
                            })
                          }
                          disabled={step.id === 4}
                          className={cn(fieldClass, "disabled:bg-muted")}
                        >
                          {step.options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 min-h-10 text-[11px] leading-5 text-muted-foreground">
                          {step.id === 4
                            ? "Pilih Docker, RDS, Aurora, atau Redshift pada Database workspace di atas."
                            : step.options.find(
                                (option) =>
                                  option.id ===
                                  (draft?.selectedOptionId ??
                                    step.recommendedOptionId),
                              )?.detail}
                        </p>

                        <SectionConfigEditor
                          stepId={step.id}
                          configuration={
                            draft?.configuration ??
                            defaultSectionConfiguration(step.id) ??
                            {}
                          }
                          onChange={(key, value) =>
                            updateSectionConfiguration(step.id, key, value)
                          }
                        />

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                            <input
                              type="checkbox"
                              checked={draft?.completed ?? false}
                              onChange={(event) =>
                                updateDraft(step.id, {
                                  completed: event.target.checked,
                                })
                              }
                              className="size-4 rounded border-border accent-emerald-600"
                            />
                            Sudah diverifikasi
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!dirty || savingStep !== null}
                            onClick={() => void saveStep(step.id)}
                          >
                            {savingStep === step.id ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Save />
                            )}
                            {savingStep === step.id ? "Menyimpan…" : "Simpan pilihan"}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <Card className="gap-0 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100">
              <CardHeader className="border-b border-white/10 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm text-white">
                      <Sparkles className="size-4 text-brand" />
                      Siap merencanakan rilis?
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs text-zinc-400">
                      Tinjau kembali arsitektur dan kriteria selesai sebelum
                      menerapkan konfigurasi ke server.
                    </CardDescription>
                  </div>
                  <Link
                    href="/guide#checklist"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                  >
                    Buka checklist
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-[11px] text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Network className="size-3.5" />
                  Nginx → Next.js → PostgreSQL
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  Tidak ada AWS API call dari workspace
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
