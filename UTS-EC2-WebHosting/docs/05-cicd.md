# Part 5 — CI/CD GitHub Actions

## Prinsip

1. **Build sekali, deploy banyak.** Image dibuat di CI, bukan di EC2 1 GB.
2. **Tag immutable.** Pakai `sha-xxxxxxx`, bukan hanya `latest`.
3. **Health check = gerbang.** Pipeline merah kalau app tidak sehat.
4. **Rollback otomatis.** Jangan menunggu manusia saat insiden.
5. **Least privilege.** Secret disimpan di GitHub Secrets; EC2 memakai IAM role.

## Workflow

### `ci.yml`

- trigger push/PR yang menyentuh `app/**`,
- Node 22 + cache npm,
- `npm ci`, `typecheck`, `build`,
- cek `.next/standalone/server.js` ada,
- build image Docker,
- jalankan `postgres:17-alpine` di network `ci-net`,
- jalankan app dengan `DATABASE_URL` + `REQUIRE_DB=true`,
- smoke test `/api/health`, `GET`/`POST /api/guestbook`, dan pastikan data yang baru ditulis terbaca.

### `deploy-ec2.yml`

```text
checkout
  → hitung tag sha-<7>
  → buildx + login GHCR
  → build & push (linux/amd64)
  → ssh ke EC2
      → git reset --hard origin/main
      → docker login GHCR
      → APP_IMAGE=... bash scripts/deploy.sh
  → ringkasan di GitHub Step Summary
```

`deploy.sh`:

1. simpan image container saat ini,
2. `docker compose pull`,
3. `docker compose up -d` (db + app + nginx),
4. polling health 60 × 2 detik — `/api/health` harus 200 **dan** `db.status = up`,
5. gagal → rollback ke image lama,
6. sukses → prune image > 24 jam.

> Deploy tidak menghapus volume `db-data`, jadi data guestbook tetap ada saat image diganti. Kredensial database tidak dikirim lewat GitHub Actions; nilainya sudah ada di `/opt/app/.env` pada EC2.

### `deploy-k8s.yml`

Manual dispatch:

- build/push image (atau pakai `image_tag` yang sudah ada),
- decode `KUBE_CONFIG`,
- `helm upgrade --install --atomic --wait`,
- `kubectl rollout status`.

## Setup awal di GitHub

1. **Settings → Secrets and variables → Actions**
   - `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_PORT` (opsional), `GHCR_TOKEN`, `KUBE_CONFIG`.
2. **Variables**
   - `SITE_URL`, `APP_DIR`, `APP_HOST`.
3. **Environments → production** (opsional): tambahkan required reviewers agar deploy butuh approval.

Membuat PAT GHCR:

- GitHub → Settings → Developer settings → Tokens (classic)
- scope: `read:packages`
- simpan sebagai `GHCR_TOKEN`.

Membuat `EC2_SSH_KEY`:

```bash
# dari laptop
cat awskeypair.pem
```

Salin **seluruh isi** (termasuk BEGIN/END) ke secret.

## Alur rilis

```bash
git checkout -b feat/hero
# ubah app
git commit -am "feat: hero"
git push origin feat/hero
# buka PR → CI jalan
# merge ke main → deploy jalan
```

Untuk rollback cepat tanpa revert commit:

```bash
# di EC2
cd /opt/app
APP_IMAGE=ghcr.io/owner/repo:sha-sebelumnya bash scripts/deploy.sh
```

Atau jalankan ulang workflow lama dari tab Actions (Re-run jobs) — image sha lama masih ada di GHCR.

## Keamanan pipeline

- Jangan `echo` secret.
- Gunakan environment `production` + required reviewer.
- Batasi `permissions` workflow (default read; `packages: write` hanya job build).
- Pin action ke versi mayor (`@v4`), idealnya ke SHA.
- Jangan berikan `EC2_SSH_KEY` ke pull request dari fork.
- Rotasi key pair jika pernah ter-expose.

## Troubleshooting pipeline

| Error | Penyebab umum |
| --- | --- |
| `dial tcp ... timeout` | SG tidak mengizinkan IP runner / host salah |
| `Permission denied (publickey)` | secret key tidak utuh / user salah |
| `denied: permission_denied` | package private & token tanpa `read:packages` |
| `health check failed` | env kurang, port salah, build tidak standalone, atau database down |
| `db.status=down` | password/`DATABASE_URL` tidak cocok, container `db` belum healthy |
| `git reset` gagal | `/opt/app` bukan clone repo |

Lihat juga [07-troubleshooting.md](07-troubleshooting.md).
