# Part 6 — Kubernetes + Helm

EC2 single VM cukup untuk Part 1. Kubernetes masuk saat butuh multi-node, autoscaling, dan self-healing.

## Konsep yang dipakai

| Objek | Fungsi |
| --- | --- |
| Deployment | menjaga replica & rolling update |
| Service | alamat stabil internal (`nextjs-app:80`) |
| Ingress | routing HTTP dari luar + TLS |
| HPA | scale berdasarkan CPU/memory |
| PDB | menjaga ketersediaan saat node drain |
| ConfigMap/Secret | konfigurasi & kredensial |
| Probe | startup/liveness/readiness ke `/api/health` |

## Coba lokal dulu

```bash
# salah satu
k3d cluster create lab --agents 2
# atau
minikube start
```

Install ingress-nginx dan cert-manager (lihat `helm/nextjs-app/README.md`).

## Helm

```bash
helm lint helm/nextjs-app
helm template nextjs helm/nextjs-app -n ec2-lab > /tmp/rendered.yaml
```

Install:

```bash
helm upgrade --install nextjs ./helm/nextjs-app \
  --namespace ec2-lab --create-namespace \
  --set image.repository=ghcr.io/owner/repo \
  --set image.tag=sha-abc1234 \
  --set ingress.hosts[0].host=app.example.com \
  --set ingress.tls[0].hosts[0]=app.example.com \
  --atomic --wait --timeout 5m
```

Cek:

```bash
kubectl get pods,svc,ingress,hpa,pdb -n ec2-lab
kubectl rollout status deployment/nextjs-nextjs-app -n ec2-lab
kubectl port-forward svc/nextjs-nextjs-app 8080:80 -n ec2-lab
curl 192.168.100.3:8080/api/health
```

## Values penting

| Key | Default | Catatan |
| --- | --- | --- |
| `replicaCount` | 2 | diabaikan jika HPA aktif |
| `image.repository` | `ghcr.io/owner/repo` | ganti |
| `image.tag` | `latest` | produksi: sha |
| `ingress.hosts[0].host` | `app.example.com` | ganti |
| `autoscaling.enabled` | true | butuh metrics-server |
| `secret.create` | false | produksi: External Secrets |
| `resources` | 50m/128Mi → 500m/512Mi | sesuaikan |

## Database di Kubernetes

Chart ini **tidak** membawa PostgreSQL. Ini disengaja: di Kubernetes, database stateful sebaiknya tidak ikut lifecycle pod aplikasi.

Pilihan yang disarankan:

1. **RDS/Aurora** — paling mudah; app hanya butuh `DATABASE_URL` + TLS.
2. **CloudNativePG / Zalando Postgres Operator** — PostgreSQL di cluster dengan PVC, failover, dan backup.
3. **StatefulSet + PVC manual** — untuk latihan; kamu harus mengurus backup dan upgrade sendiri.

Aktifkan database dengan Secret (jangan simpan password di `values.yaml`):

```bash
kubectl create secret generic nextjs-db -n ec2-lab \
  --from-literal=DATABASE_URL='postgres://user:pass@db-host:5432/ec2lab?sslmode=require'

helm upgrade --install nextjs ./helm/nextjs-app \
  --namespace ec2-lab \
  --set image.repository=ghcr.io/owner/repo \
  --set image.tag=sha-abc1234 \
  --set env.REQUIRE_DB=true \
  --set secret.create=false \
  --set secret.name=nextjs-db
```

Saat `secret.name` diisi, Deployment memakai Secret itu sebagai `envFrom`. Pastikan key-nya `DATABASE_URL` (dan `ADMIN_TOKEN` bila perlu). Untuk RDS, set `DATABASE_SSL=true` bila endpoint memerlukan TLS.

> `/api/health` di K8s ikut memeriksa database bila `REQUIRE_DB=true`. Jika probe dibuat terlalu ketat dan database eksternal sempat down, pod bisa dianggap tidak siap — sesuaikan `probes.readiness` atau gunakan endpoint health terpisah untuk liveness.

## Manifest mentah

```bash
kubectl apply -k k8s
kubectl get all -n ec2-lab
```

Jangan lupa ganti image dan host di `k8s/deployment.yaml` / `k8s/ingress.yaml` sebelum apply.

## Keamanan container

Chart & manifest sudah:

- `runAsNonRoot` UID 1001,
- `readOnlyRootFilesystem: true` + emptyDir untuk `/tmp` dan `.next/cache`,
- drop semua capability,
- `automountServiceAccountToken: false`,
- seccomp `RuntimeDefault`.

## Catatan produksi

- Gunakan EKS + ALB Ingress Controller, atau k3s + Traefik.
- Simpan secret di AWS Secrets Manager + External Secrets Operator.
- Gunakan IRSA (IAM Roles for Service Accounts) untuk akses AWS.
- Pasang metrics-server agar HPA bekerja.
- Tambahkan NetworkPolicy, resource quota, dan image pull secret untuk GHCR privat.
- Database: gunakan RDS/operator, bukan container di dalam pod app. Backup dan restore tetap tanggung jawab terpisah.
