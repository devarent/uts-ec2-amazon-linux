"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Database,
  Loader2,
  Save,
  Search,
  Server,
  ShieldCheck,
} from "lucide-react";
import {
  DEFAULT_DATABASE_CONFIGURATION,
  type DatabaseConfiguration,
  type DatabaseProvider,
} from "@/lib/database-config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  onProviderSaved: (configuration: DatabaseConfiguration) => void;
};

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-ring/60 focus:border-ring focus:ring-2 focus:ring-ring/20";
const labelClass = "block text-xs font-medium text-foreground";
const hintClass = "mt-1 block text-[10px] leading-5 text-muted-foreground";

const regions: Array<[string, string]> = [
  ["ap-southeast-3", "Asia Pacific (Jakarta)"],
  ["ap-southeast-1", "Asia Pacific (Singapore)"],
  ["ap-southeast-2", "Asia Pacific (Sydney)"],
  ["ap-northeast-1", "Asia Pacific (Tokyo)"],
  ["us-east-1", "US East (N. Virginia)"],
  ["us-west-2", "US West (Oregon)"],
];

const providers: Array<[DatabaseProvider, string, string]> = [
  [
    "docker-postgres17",
    "PostgreSQL di EC2",
    "Container Docker, volume persisten, cocok untuk lab satu instance.",
  ],
  [
    "rds-postgres",
    "Amazon RDS · PostgreSQL",
    "Database relasional terkelola; cocok dengan Terraform RDS yang tersedia.",
  ],
  [
    "rds-mysql",
    "Amazon RDS · MySQL",
    "Opsi relasional terkelola; rencana konfigurasi, belum didukung modul Terraform repo.",
  ],
  [
    "rds-mariadb",
    "Amazon RDS · MariaDB",
    "Database relasional kompatibel MySQL.",
  ],
  [
    "rds-sqlserver",
    "Amazon RDS · SQL Server",
    "SQL Server terkelola; lisensi dan kelas instance dapat memengaruhi biaya.",
  ],
  [
    "rds-oracle",
    "Amazon RDS · Oracle",
    "Oracle terkelola; cek opsi lisensi dan engine di region.",
  ],
  [
    "aurora-postgresql",
    "Amazon Aurora · PostgreSQL",
    "Database cloud-native kompatibel PostgreSQL; biaya dan kapasitas berbeda.",
  ],
  [
    "aurora-mysql",
    "Amazon Aurora · MySQL",
    "Database cloud-native kompatibel MySQL; rencana konfigurasi.",
  ],
  [
    "redshift-serverless",
    "Amazon Redshift Serverless",
    "Data warehouse analitik; bukan pengganti database transaksi aplikasi.",
  ],
  [
    "documentdb",
    "Amazon DocumentDB",
    "Database dokumen kompatibel MongoDB.",
  ],
  ["neptune", "Amazon Neptune", "Database graph terkelola."],
  [
    "elasticache-redis",
    "Amazon ElastiCache · Redis OSS",
    "Cache in-memory; bukan database utama untuk transaksi.",
  ],
  ["opensearch", "Amazon OpenSearch Service", "Search dan analytics engine."],
  [
    "external-postgres",
    "External · PostgreSQL",
    "Catat endpoint localhost, IP, DNS, atau service Docker; koneksi tidak diuji.",
  ],
  [
    "external-mysql",
    "External · MySQL",
    "Catat endpoint localhost, IP, DNS, atau service Docker; koneksi tidak diuji.",
  ],
  [
    "external-mariadb",
    "External · MariaDB",
    "Catat endpoint localhost, IP, DNS, atau service Docker; koneksi tidak diuji.",
  ],
];

function providerLabel(provider: DatabaseProvider) {
  return providers.find(([id]) => id === provider)?.[1] ?? provider;
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  min,
  max,
}: {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label htmlFor={id} className={labelClass}>
      {label}
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </label>
  );
}

function Choice({
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

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 transition hover:border-ring/50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 rounded border-border accent-primary"
      />
      <span>
        <span className="block text-xs font-medium text-foreground">{title}</span>
        <span className={hintClass}>{description}</span>
      </span>
    </label>
  );
}

function ConfigSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-start gap-2.5 border-b border-border bg-muted/30 px-4 py-3.5 sm:px-5">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          <Database className="size-3" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-5 p-4 sm:p-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export default function DatabaseWorkspace({ onProviderSaved }: Props) {
  const [configuration, setConfiguration] = useState(
    DEFAULT_DATABASE_CONFIGURATION,
  );
  const [savedConfiguration, setSavedConfiguration] = useState(
    DEFAULT_DATABASE_CONFIGURATION,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [providerSearch, setProviderSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/database-config", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          configuration?: DatabaseConfiguration;
          error?: string;
        };
        if (!response.ok || !payload.configuration) {
          throw new Error(payload.error ?? "database_configuration_unavailable");
        }
        if (active) {
          setConfiguration(payload.configuration);
          setSavedConfiguration(payload.configuration);
        }
      } catch (loadError) {
        console.error("[database-workspace] load failed:", loadError);
        if (active)
          setError("Konfigurasi database gagal dimuat dari PostgreSQL.");
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
  const isDocker = configuration.provider === "docker-postgres17";
  const isWarehouse = configuration.provider === "redshift-serverless";
  const isAurora = configuration.provider.startsWith("aurora-");
  const isExternal = configuration.provider.startsWith("external-");
  const isCacheOrSearch =
    configuration.provider === "elasticache-redis" ||
    configuration.provider === "opensearch";
  const filteredProviders = useMemo(
    () =>
      providers.filter(([, title, description]) =>
        `${title} ${description}`
          .toLowerCase()
          .includes(providerSearch.trim().toLowerCase()),
      ),
    [providerSearch],
  );

  const instanceClassOptions: Array<[string, string]> = isWarehouse
    ? [["serverless", "Serverless · Redshift processing"]]
    : configuration.provider === "elasticache-redis"
      ? [
          ["cache.t4g.micro", "cache.t4g.micro · burstable"],
          ["cache.t4g.small", "cache.t4g.small · burstable"],
        ]
      : configuration.provider === "opensearch"
        ? [["m7g.large.search", "m7g.large.search · general purpose"]]
        : [
            ["db.t4g.micro", "db.t4g.micro · burstable"],
            ["db.t4g.small", "db.t4g.small · burstable"],
            ["db.m7g.large", "db.m7g.large · general purpose"],
            ["db.r6g.large", "db.r6g.large · memory optimized"],
            ...(isAurora
              ? [["serverless", "Aurora Serverless v2"] as [string, string]]
              : []),
          ];

  function update(patch: Partial<DatabaseConfiguration>) {
    setConfiguration((current) => ({ ...current, ...patch }));
    setNotice("");
  }

  function changeProvider(provider: DatabaseProvider) {
    const defaultsByProvider: Partial<Record<DatabaseProvider, number>> = {
      "docker-postgres17": 5432,
      "rds-postgres": 5432,
      "rds-mysql": 3306,
      "rds-mariadb": 3306,
      "rds-sqlserver": 1433,
      "rds-oracle": 1521,
      "aurora-postgresql": 5432,
      "aurora-mysql": 3306,
      "redshift-serverless": 5439,
      documentdb: 27017,
      neptune: 8182,
      "elasticache-redis": 6379,
      opensearch: 443,
      "external-postgres": 5432,
      "external-mysql": 3306,
      "external-mariadb": 3306,
    };
    const versionsByProvider: Record<DatabaseProvider, string> = {
      "docker-postgres17": "17",
      "rds-postgres": "17",
      "rds-mysql": "8.0",
      "rds-mariadb": "11.4",
      "rds-sqlserver": "16.00",
      "rds-oracle": "19c",
      "aurora-postgresql": "16",
      "aurora-mysql": "3",
      "redshift-serverless": "latest",
      documentdb: "5.0",
      neptune: "1.4",
      "elasticache-redis": "7",
      opensearch: "2",
      "external-postgres": "latest",
      "external-mysql": "latest",
      "external-mariadb": "latest",
    };
    const defaults =
      provider === "docker-postgres17"
        ? {
            networkMode: "docker-internal" as const,
            port: 5432,
            instanceClass: "db.t4g.micro",
          }
        : provider.startsWith("external-")
          ? {
              networkMode: "external-endpoint" as const,
              port: defaultsByProvider[provider] ?? 5432,
              instanceClass: "db.t4g.micro",
              endpointType: "dns" as const,
              endpointHost: "",
            }
          : provider === "redshift-serverless"
            ? {
                networkMode: "private-subnets" as const,
                port: 5439,
                instanceClass: "serverless",
              }
            : provider === "elasticache-redis"
              ? {
                  networkMode: "private-subnets" as const,
                  port: 6379,
                  instanceClass: "cache.t4g.micro",
                }
              : provider === "opensearch"
                ? {
                    networkMode: "private-subnets" as const,
                    port: 443,
                    instanceClass: "m7g.large.search",
                  }
                : {
                    networkMode: "private-subnets" as const,
                    port: defaultsByProvider[provider] ?? 5432,
                    instanceClass: "db.t4g.micro",
                  };
    update({
      provider,
      engineVersion: versionsByProvider[provider],
      ...defaults,
      endpointType:
        provider === "docker-postgres17"
          ? "docker-service"
          : (defaults.endpointType ?? "dns"),
      endpointHost:
        provider === "docker-postgres17"
          ? "db"
          : (defaults.endpointHost ?? ""),
    });
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/database-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configuration }),
      });
      const payload = (await response.json()) as {
        configuration?: DatabaseConfiguration;
        error?: string;
      };
      if (!response.ok || !payload.configuration) {
        throw new Error(payload.error ?? "save_failed");
      }
      setConfiguration(payload.configuration);
      setSavedConfiguration(payload.configuration);
      onProviderSaved(payload.configuration);
      setNotice("Konfigurasi database berhasil disimpan ke PostgreSQL.");
    } catch (saveError) {
      console.error("[database-workspace] save failed:", saveError);
      setError("Perubahan belum tersimpan. Periksa konfigurasi dan koneksi database.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="database" className="scroll-mt-24">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/30 p-5 sm:flex-row sm:items-start sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="info" className="gap-1.5">
                <Database className="size-3" />
                Database & analytics
              </Badge>
              <Badge variant="outline" className="bg-background">
                <ShieldCheck className="size-3" />
                Privat
              </Badge>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
              Database workspace
            </h2>
            <p className="mt-1.5 max-w-3xl text-xs leading-6 text-muted-foreground">
              Atur database aplikasi, konektivitas, keamanan, kapasitas, dan
              backup. Konfigurasi tersimpan per akun di PostgreSQL; halaman ini
              tidak membuat resource AWS atau menjalankan Terraform.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0">
            {providerLabel(configuration.provider)}
          </Badge>
        </div>

        <div className="p-4 sm:p-5">
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={providerSearch}
              onChange={(event) => setProviderSearch(event.target.value)}
              placeholder="Cari engine: PostgreSQL, MySQL, Aurora, warehouse…"
              aria-label="Cari database engine"
              className="pl-9"
            />
          </div>

          <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProviders.map(([id, title, description]) => {
              const selected = configuration.provider === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeProvider(id)}
                  className={cn(
                    "group relative rounded-lg border p-3.5 text-left transition",
                    selected
                      ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                      : "border-border bg-background hover:border-ring/60 hover:bg-muted/30",
                  )}
                  aria-pressed={selected}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {title}
                    </span>
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-transparent",
                      )}
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[10px] leading-5 text-muted-foreground">
                    {description}
                  </span>
                </button>
              );
            })}
            {filteredProviders.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                Tidak ada engine yang sesuai pencarian.
              </p>
            ) : null}
          </div>

          <Alert variant="warning" className="mt-4 py-3">
            <ShieldCheck />
            <AlertDescription className="text-xs leading-5">
              <strong>Penting:</strong> semua pilihan di sini hanya disimpan
              sebagai konfigurasi aplikasi. Tidak ada AWS API, koneksi database
              baru, atau provisioning resource yang dijalankan. Credential dan
              secret tidak disimpan; database publik dinonaktifkan.{" "}
              {isDocker
                ? "PostgreSQL lokal tetap memakai volume Docker db-data."
                : `${providerLabel(configuration.provider)} dapat menimbulkan biaya bila dibuat secara terpisah di providernya.`}
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert variant="destructive" className="mt-4 py-3">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {notice ? (
            <Alert variant="success" className="mt-4 py-3">
              <CheckCircle2 />
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          ) : null}

          {loading ? (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat database dari PostgreSQL…
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <ConfigSection
                id="database-engine"
                title="Engine & resource"
                description="Pilih engine, region, dan identitas database."
              >
                <Choice
                  id="database-engine-choice"
                  label="Database engine"
                  value={configuration.provider}
                  onChange={(value) => changeProvider(value as DatabaseProvider)}
                  options={providers.map(
                    ([id, title]) => [id, title] as [string, string],
                  )}
                />
                <Choice
                  id="database-region"
                  label="AWS Region"
                  value={configuration.region}
                  onChange={(region) => update({ region })}
                  options={regions}
                />
                <Field
                  id="database-resource-name"
                  label={
                    isWarehouse
                      ? "Workgroup name"
                      : "DB instance / cluster identifier"
                  }
                  value={configuration.resourceName}
                  onChange={(resourceName) => update({ resourceName })}
                  hint="1–63 karakter; diawali huruf, lalu huruf, angka, dan tanda hubung."
                />
                <Field
                  id="database-name"
                  label={isWarehouse ? "Initial database" : "Initial database name"}
                  value={configuration.databaseName}
                  onChange={(databaseName) => update({ databaseName })}
                />
                <Field
                  id="database-engine-version"
                  label="Engine version"
                  value={configuration.engineVersion}
                  onChange={(engineVersion) => update({ engineVersion })}
                  placeholder={configuration.provider.includes("mysql") ? "8.0" : "17"}
                  hint="Pilih versi yang tersedia untuk region dan engine."
                />
                {!isAurora && !isWarehouse && !isCacheOrSearch && !isExternal ? (
                  <Choice
                    id="database-port"
                    label="Port"
                    value={String(configuration.port)}
                    onChange={(value) => update({ port: Number(value) })}
                    options={[
                      ["5432", "5432 · PostgreSQL"],
                      ["3306", "3306 · MySQL / Aurora MySQL"],
                    ]}
                  />
                ) : null}
                {isExternal ? (
                  <>
                    <Choice
                      id="database-endpoint-type"
                      label="Endpoint type"
                      value={configuration.endpointType}
                      onChange={(endpointType) =>
                        update({
                          endpointType:
                            endpointType as DatabaseConfiguration["endpointType"],
                        })
                      }
                      options={[
                        ["localhost", "localhost / local machine"],
                        ["ipv4", "IPv4 address"],
                        ["dns", "DNS hostname"],
                        ["docker-service", "Docker service hostname"],
                      ]}
                    />
                    <Field
                      id="database-endpoint-host"
                      label={
                        configuration.endpointType === "ipv4"
                          ? "Server IPv4 address"
                          : configuration.endpointType === "dns"
                            ? "Server DNS hostname"
                            : "Server hostname"
                      }
                      value={configuration.endpointHost}
                      onChange={(endpointHost) => update({ endpointHost })}
                      placeholder={
                        configuration.endpointType === "ipv4"
                          ? "192.168.1.20"
                          : configuration.endpointType === "dns"
                            ? "db.example.com"
                            : configuration.endpointType === "docker-service"
                              ? "database"
                              : "localhost"
                      }
                      hint="Endpoint hanya disimpan; aplikasi tidak menghubungi host ini."
                    />
                  </>
                ) : null}
              </ConfigSection>

              <ConfigSection
                id="database-capacity"
                title="Capacity & availability"
                description="Tentukan kelas kapasitas, storage, dan ketersediaan."
              >
                <Choice
                  id="database-instance-class"
                  label={isWarehouse ? "Capacity mode" : "DB instance class"}
                  value={configuration.instanceClass}
                  onChange={(instanceClass) => update({ instanceClass })}
                  options={instanceClassOptions}
                  hint="Biaya bergantung pada engine, region, dan durasi aktif."
                />
                {!isAurora && !isWarehouse && !isCacheOrSearch && !isExternal ? (
                  <>
                    <Field
                      id="database-storage"
                      label="Allocated storage (GiB)"
                      type="number"
                      min={20}
                      max={65536}
                      value={configuration.storageGb}
                      onChange={(value) => update({ storageGb: Number(value) })}
                      hint="Minimum 20 GiB; angka lebih besar meningkatkan biaya."
                    />
                    <Choice
                      id="database-storage-type"
                      label="Storage type"
                      value={configuration.storageType}
                      onChange={(storageType) =>
                        update({ storageType: storageType as "gp3" | "io2" })
                      }
                      options={[
                        ["gp3", "General Purpose SSD (gp3)"],
                        ["io2", "Provisioned IOPS SSD (io2)"],
                      ]}
                    />
                  </>
                ) : isExternal ? (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-[11px] leading-5 text-sky-900">
                    Untuk endpoint eksternal, kelas instance dan kapasitas storage
                    dikelola oleh server tujuan. Form ini hanya menyimpan alamat
                    dan metadata koneksi tanpa kredensial.
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-5 text-muted-foreground">
                    {isWarehouse
                      ? "Redshift Serverless menagih kapasitas pemrosesan warehouse; storage data dikelola terpisah."
                      : "Aurora mengelola storage secara otomatis; kapasitas cluster diatur melalui instance atau Serverless v2."}
                  </div>
                )}
                <Toggle
                  checked={configuration.multiAz}
                  onChange={(multiAz) => update({ multiAz })}
                  title="Multi-AZ / high availability"
                  description="Standby atau deployment multi-AZ meningkatkan ketahanan dan biaya."
                />
              </ConfigSection>

              <ConfigSection
                id="database-network"
                title="Connectivity & security"
                description="Jaringan privat, enkripsi, perlindungan, dan akses."
              >
                <Choice
                  id="database-network-mode"
                  label="Network placement"
                  value={configuration.networkMode}
                  onChange={(networkMode) =>
                    update({
                      networkMode:
                        networkMode as DatabaseConfiguration["networkMode"],
                    })
                  }
                  options={
                    isDocker
                      ? [["docker-internal", "Docker internal network · EC2"]]
                      : isExternal
                        ? [
                            [
                              "external-endpoint",
                              "External endpoint · localhost / IP / DNS",
                            ],
                          ]
                        : [["private-subnets", "Private subnets · VPC"]]
                  }
                />
                <Field
                  id="database-port-network"
                  label="Database port"
                  type="number"
                  min={1}
                  max={65535}
                  value={configuration.port}
                  onChange={(value) => update({ port: Number(value) })}
                  hint={
                    configuration.networkMode === "external-endpoint"
                      ? "Catatan port untuk endpoint tujuan; tidak diuji atau dibuka."
                      : "Akses hanya dari security group aplikasi."
                  }
                />
                <Toggle
                  checked={configuration.storageEncrypted}
                  onChange={(storageEncrypted) => update({ storageEncrypted })}
                  title="Storage encryption"
                  description="Enkripsi data-at-rest; KMS key dikelola di AWS."
                />
                <Toggle
                  checked={configuration.deletionProtection}
                  onChange={(deletionProtection) => update({ deletionProtection })}
                  title="Deletion protection"
                  description="Mencegah penghapusan database yang tidak disengaja."
                />
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-900 md:col-span-2">
                  <strong>Public access: Disabled.</strong> Database tidak boleh
                  dapat diakses dari internet. Ini dikunci untuk menjaga port DB
                  tetap privat.
                </div>
                {isExternal && configuration.endpointType === "localhost" ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950 md:col-span-2">
                    Catatan Docker: `localhost` dari dalam container menunjuk ke
                    container app itu sendiri. Untuk host Windows/Docker Desktop
                    pertimbangkan `host.docker.internal`; untuk service Compose,
                    gunakan nama service database.
                  </div>
                ) : null}
              </ConfigSection>

              <ConfigSection
                id="database-backups"
                title="Backup & maintenance"
                description="Catat retensi backup yang diinginkan untuk konfigurasi database."
              >
                <Field
                  id="database-backup-retention"
                  label="Backup retention (days)"
                  type="number"
                  min={0}
                  max={35}
                  value={configuration.backupRetentionDays}
                  onChange={(value) =>
                    update({ backupRetentionDays: Number(value) })
                  }
                  hint="0 menonaktifkan backup otomatis; maksimum 35 hari."
                />
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-[11px] leading-5 text-sky-900 md:col-span-2">
                  Pengaturan hanya dicatat ke database aplikasi. Tidak ada
                  provisioning, terraform plan, atau apply yang dijalankan dari
                  sini.
                </div>
              </ConfigSection>

              <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-3xl text-[11px] leading-5 text-muted-foreground">
                  Password database dan DATABASE_URL tidak disimpan di formulir.
                  Kelola secret melalui environment/Secrets Manager. Penyimpanan
                  memperbarui pilihan tahap 04 dalam transaksi PostgreSQL yang
                  sama.
                </p>
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
