const steps = [
  {
    id: "01",
    title: "Siapkan instance EC2",
    desc: "Pilih region, sistem operasi, ukuran mesin virtual, key pair untuk akses, dan Elastic IP agar alamat server tetap.",
    tag: "Komputasi",
  },
  {
    id: "02",
    title: "Atur firewall jaringan",
    desc: "Izinkan SSH hanya dari IP admin. Buka HTTP/HTTPS untuk web; jangan publikasikan port aplikasi atau database.",
    tag: "Jaringan",
  },
  {
    id: "03",
    title: "Siapkan Linux dan Docker",
    desc: "Pasang Docker Engine, Compose v2, Git, ruang swap, dan direktori aplikasi agar server siap menjalankan container.",
    tag: "Sistem operasi",
  },
  {
    id: "04",
    title: "Jalankan aplikasi dan database",
    desc: "Bangun image Docker yang aman, jalankan Next.js sebagai pengguna non-root, dan simpan PostgreSQL pada volume persisten.",
    tag: "Container",
  },
  {
    id: "05",
    title: "Pasang Nginx sebagai proxy",
    desc: "Nginx menerima lalu lintas web, meneruskan permintaan ke aplikasi, mengatur HTTPS, header keamanan, dan kompresi.",
    tag: "Web server",
  },
  {
    id: "06",
    title: "Hubungkan domain dan HTTPS",
    desc: "Arahkan DNS ke Elastic IP, aktifkan sertifikat TLS gratis, lalu pastikan sertifikat diperpanjang otomatis.",
    tag: "Domain",
  },
  {
    id: "07",
    title: "Terraform",
    desc: "Tuliskan jaringan, izin IAM, instance, dan DNS sebagai kode agar perubahan dapat ditinjau sebelum dibuat.",
    tag: "Infrastruktur sebagai kode",
  },
  {
    id: "08",
    title: "Otomatiskan rilis aplikasi",
    desc: "Otomatiskan proses build, publikasi image, deployment, pemeriksaan kesehatan, dan pemulihan saat rilis gagal.",
    tag: "CI/CD",
  },
  {
    id: "09",
    title: "Lanjut ke Kubernetes dan Helm",
    desc: "Pelajari pengelolaan banyak container dan penskalaan aplikasi setelah deployment satu server stabil.",
    tag: "Orkestrasi",
  },
] as const;

const checklist = [
  "Instance EC2 Debian 13 (t3.micro) berstatus berjalan",
  "Firewall hanya membuka SSH terbatas, HTTP, dan HTTPS—bukan port 3000",
  "Elastic IP terpasang dan DNS domain mengarah ke alamat tersebut",
  "Docker dan Compose v2 tetap aktif setelah server dimulai ulang",
  "Aplikasi dan database berstatus sehat di /api/health",
  "Data guestbook tersimpan di volume PostgreSQL dan pencadangan berjalan",
  "Nginx mengembalikan respons berhasil melalui domain HTTPS",
  "Sertifikat Let's Encrypt dapat diperpanjang otomatis",
  "Pipeline deployment lulus pemeriksaan dan memiliki rencana pemulihan",
];

const stack = [
  "Next.js 16",
  "React 19",
  "Tailwind CSS 4",
  "PostgreSQL 17",
  "Docker",
  "Nginx",
  "Terraform",
  "Helm",
  "Kubernetes",
  "GitHub Actions",
  "Route 53",
  "Let's Encrypt",
  "AWS EC2",
];

export { steps, checklist, stack };
