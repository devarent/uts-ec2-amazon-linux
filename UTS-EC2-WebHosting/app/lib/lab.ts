export type LabOption = {
  id: string;
  label: string;
  detail: string;
};

export type LabStep = {
  id: number;
  category: string;
  title: string;
  description: string;
  options: LabOption[];
  recommendedOptionId: string;
};

export const LAB_STEPS: LabStep[] = [
  {
    id: 1,
    category: "AWS",
    title: "EC2 dan region",
    description: "Pilih region dan ukuran untuk satu instance lab.",
    options: [
      { id: "jakarta-t3-micro", label: "Jakarta · t3.micro", detail: "Default hemat untuk demo; kapasitas RAM terbatas." },
      { id: "singapore-t3-micro", label: "Singapore · t3.micro", detail: "Alternatif bila layanan/kuota Jakarta tidak tersedia." },
      { id: "jakarta-t3-small", label: "Jakarta · t3.small", detail: "RAM lebih lega, tetapi biaya EC2 lebih tinggi." },
    ],
    recommendedOptionId: "jakarta-t3-micro",
  },
  {
    id: 2,
    category: "Network",
    title: "Akses jaringan",
    description: "Tentukan cara administrasi. Web publik hanya lewat 80/443.",
    options: [
      { id: "ssh-ip32", label: "SSH dibatasi ke IP /32", detail: "Port 22 hanya dari IPv4 admin; jangan gunakan 0.0.0.0/0." },
      { id: "ssm-only", label: "SSM saja (tanpa SSH publik)", detail: "Pilihan yang disarankan bila IAM/SSM sudah disiapkan." },
    ],
    recommendedOptionId: "ssm-only",
  },
  {
    id: 3,
    category: "Linux",
    title: "OS dan Docker",
    description: "Bootstrap OS, Docker Engine, Compose v2, Git, dan swap.",
    options: [
      { id: "debian13-compose", label: "Debian 13 + Docker Compose v2", detail: "Sesuai bootstrap dan dokumentasi EC2 lab." },
      { id: "ubuntu2404-compose", label: "Ubuntu 24.04 + Docker Compose v2", detail: "Alternatif manual; sesuaikan AMI dan user SSH." },
    ],
    recommendedOptionId: "debian13-compose",
  },
  {
    id: 4,
    category: "Database",
    title: "Database",
    description: "Pilih database aplikasi atau data warehouse. Resource AWS terkelola dapat menambah biaya.",
    options: [
      { id: "docker-postgres17", label: "PostgreSQL 17 dalam Docker", detail: "Rekomendasi UTS: volume persisten di EC2, port 5432 tidak dipublikasikan." },
      { id: "rds-postgres-private", label: "AWS RDS PostgreSQL privat", detail: "Terkelola, subnet privat, hanya koneksi dari security group EC2." },
      { id: "rds-mysql-private", label: "AWS RDS MySQL privat", detail: "Database relasional terkelola, subnet privat; siapkan provisioning MySQL terpisah." },
      { id: "rds-mariadb-private", label: "AWS RDS MariaDB privat", detail: "Database relasional MariaDB terkelola, konfigurasi dicatat saja." },
      { id: "rds-sqlserver-private", label: "AWS RDS SQL Server privat", detail: "Database SQL Server terkelola, konfigurasi dicatat saja." },
      { id: "rds-oracle-private", label: "AWS RDS Oracle privat", detail: "Database Oracle terkelola, konfigurasi dicatat saja." },
      { id: "aurora-postgresql-private", label: "Amazon Aurora PostgreSQL privat", detail: "Database kompatibel PostgreSQL; siapkan konfigurasi cluster Aurora." },
      { id: "aurora-mysql-private", label: "Amazon Aurora MySQL privat", detail: "Database kompatibel MySQL; siapkan konfigurasi cluster Aurora." },
      { id: "redshift-serverless-private", label: "Amazon Redshift Serverless privat", detail: "Data warehouse analitik, bukan pengganti database transaksi aplikasi." },
      { id: "documentdb-private", label: "Amazon DocumentDB privat", detail: "Database dokumen managed; konfigurasi dicatat saja." },
      { id: "neptune-private", label: "Amazon Neptune privat", detail: "Database graph managed; konfigurasi dicatat saja." },
      { id: "elasticache-redis-private", label: "Amazon ElastiCache Redis privat", detail: "Cache in-memory, bukan penyimpanan transaksi utama." },
      { id: "opensearch-private", label: "Amazon OpenSearch privat", detail: "Search dan analytics managed." },
      { id: "external-postgres", label: "External PostgreSQL endpoint", detail: "Host localhost, IP, DNS, atau Docker service dicatat tanpa menguji koneksi." },
      { id: "external-mysql", label: "External MySQL endpoint", detail: "Host localhost, IP, DNS, atau Docker service dicatat tanpa menguji koneksi." },
      { id: "external-mariadb", label: "External MariaDB endpoint", detail: "Host localhost, IP, DNS, atau Docker service dicatat tanpa menguji koneksi." },
    ],
    recommendedOptionId: "docker-postgres17",
  },
  {
    id: 5,
    category: "Nginx",
    title: "Reverse proxy dan HTTPS",
    description: "Jangan mengekspos port aplikasi atau database ke internet.",
    options: [
      { id: "nginx-certbot", label: "Nginx + Let's Encrypt", detail: "TLS pada 443, redirect HTTP, pembaruan sertifikat otomatis." },
      { id: "nginx-http-smoke", label: "Nginx HTTP untuk smoke test", detail: "Hanya sementara sebelum DNS dan sertifikat disiapkan." },
    ],
    recommendedOptionId: "nginx-certbot",
  },
  {
    id: 6,
    category: "DNS",
    title: "Domain dan alamat IP",
    description: "Gunakan Elastic IP agar alamat origin tetap stabil.",
    options: [
      { id: "route53-eip", label: "Route 53 A record ke Elastic IP", detail: "Terraform dapat mengelola record bila hosted zone tersedia." },
      { id: "external-dns-eip", label: "DNS eksternal ke Elastic IP", detail: "Kelola record di provider DNS yang sudah digunakan." },
      { id: "eip-only", label: "Elastic IP tanpa domain", detail: "Untuk uji HTTP; HTTPS Let's Encrypt memerlukan domain." },
    ],
    recommendedOptionId: "route53-eip",
  },
  {
    id: 7,
    category: "IaC",
    title: "Provisioning",
    description: "Catat cara membuat resource agar perubahan dapat ditinjau.",
    options: [
      { id: "terraform-plan", label: "Terraform (rencana konfigurasi)", detail: "Pilihan ini hanya disimpan sebagai catatan; aplikasi tidak menjalankan Terraform plan atau apply." },
      { id: "console-manual", label: "AWS Console (langkah belajar)", detail: "Pilihan ini hanya disimpan sebagai catatan; aplikasi tidak membuat atau mengubah resource." },
    ],
    recommendedOptionId: "terraform-plan",
  },
  {
    id: 8,
    category: "CI/CD",
    title: "Pipeline deployment",
    description: "Pilih pipeline untuk build, deploy, health check, dan rollback.",
    options: [
      { id: "github-actions-ghcr", label: "GitHub Actions + GHCR", detail: "Pipeline yang disediakan repo; deploy via SSH dan health check." },
      { id: "aws-codepipeline", label: "AWS CodePipeline + CodeBuild", detail: "Alternatif pipeline AWS; siapkan IAM dan biaya build terkait." },
      { id: "gitlab-ci", label: "GitLab CI/CD", detail: "Alternatif pipeline GitLab; simpan key sebagai protected variables." },
      { id: "jenkins", label: "Jenkins", detail: "Opsi belajar mandiri; amankan controller dan credentials." },
    ],
    recommendedOptionId: "github-actions-ghcr",
  },
  {
    id: 9,
    category: "Kubernetes",
    title: "Naik kelas ke Kubernetes",
    description: "Selesaikan container, PostgreSQL, dan health check sebelum pindah.",
    options: [
      { id: "single-vm-first", label: "Tetap satu VM dahulu", detail: "Rekomendasi UTS; validasi backup, HTTPS, dan deploy." },
      { id: "eks-helm-later", label: "EKS + Helm (tahap lanjutan)", detail: "Rencanakan biaya cluster, ingress, storage, dan observability." },
    ],
    recommendedOptionId: "single-vm-first",
  },
];
