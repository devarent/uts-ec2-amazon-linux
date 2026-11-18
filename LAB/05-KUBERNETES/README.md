# 05 — KUBERNETES (kind di WSL2 / k3s di VM)

## Opsi A — kind (Kubernetes di Docker, di WSL2) — paling mudah

```bash
kind create cluster --config LAB/05-KUBERNETES/kind-cluster.yaml
kubectl get nodes
kubectl apply -k LAB/05-KUBERNETES/manifests/
kubectl -n uts get pods -o wide
kubectl -n uts get svc
curl http://192.168.100.3:8080          # host 8080 -> NodePort 30080
```

Melihat skala & self-healing (bagus untuk demo):

```bash
kubectl -n uts scale deployment/website --replicas=4
kubectl -n uts get pods -w              # amati pod dibuat ulang
kubectl -n uts delete pod -l app=website  # hapus dipaksa → Deployment buat ulang
```

Eksperimen (aduan untuk video):

```bash
kubectl -n uts logs -l app=website --tail=20 -f
kubectl -n uts describe pod <nama-pod>
kubectl -n uts port-forward svc/website 9090:80   # akses tanpa NodePort
```

Hapus cluster:

```bash
kind delete cluster --name uts-k8s
```

---

## Opsi B — k3s di VM-2 (Ubuntu Server) — Kubernetes di server asli

```bash
ssh -i ~/.ssh/lab_ec2 ubuntu@192.168.56.20
curl -sfL https://get.k3s.io | sh -
sudo systemctl status k3s
sudo k3s kubectl get nodes
# salin manifest dari repo (dari WSL2/Windows):
#   scp -r LAB/05-KUBERNETES ubuntu@192.168.56.20:~/
sudo k3s kubectl apply -k ~/05-KUBERNETES/manifests/
curl http://192.168.56.20:30080
```

> k3s memakai **containerd** (bukan Docker) bila distribusi default dipakai.

---

## Konsep utama yang harus bisa dijelaskan di video

| Objek | Fungsi | Analogi AWS |
|---|---|---|
| Pod | Unit deploy terkecil, 1+ container | 1 task ECS |
| ReplicaSet/Deployment | Menjaga jumlah replica, self-healing, rolling update | Auto Scaling Group |
| Service (NodePort) | IP stabil + load balancing ke pod | Internal LB / NodePort |
| ConfigMap | Konfigurasi/HTML sebagai data | user_data / SSM Parameter |
| Namespace | Isolasi "environment" | AWS account per env |
| NodePort | Akses langsung dari luar cluster | Security Group + port terbuka |

## Troubleshooting

| Gejala | Cek |
|---|---|
| `kind: permission denied` | `docker info` OK? user di group `docker`? |
| `ImagePullBackOff` | image name salah / internet VM mati → `docker pull nginx:1.27-alpine` |
| Pod `CrashLoopBackOff` | `kubectl -n uts logs <pod>` → periksa port/mount |
| `curl 192.168.100.3:8080` timeout | `kubectl get svc -n uts` pastikan type NodePort; port-forward sebagai alternatif |
| `kubectl: connection refused` | `kind get clusters`, `kind create cluster ...` lagi |
