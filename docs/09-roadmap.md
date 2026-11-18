# Roadmap & langkah berikutnya

Urutan belajar yang dipakai lab ini:

```text
Linux → Git/GitHub → Cloud fundamentals → AWS
      → Docker → Kubernetes → Terraform
      → CI/CD → Monitoring
```

## Part 1 (repo ini)

- [x] Linux dasar di EC2
- [x] Git/GitHub workflow
- [x] AWS: EC2, SG, EIP, IAM, Route 53
- [x] Docker multi-stage + Compose
- [x] Nginx + HTTPS
- [x] Terraform dasar
- [x] GitHub Actions build & deploy
- [x] Helm/K8s manifest (opsional)

## Part 2 — Network & security

- VPC public/private subnet, NAT vs VPC Endpoint
- ALB + ACM (HTTPS tanpa Nginx)
- IAM least privilege, SSM Session Manager
- WAF, Shield, KMS
- Secrets Manager / SSM Parameter Store

## Part 3 — Data & messaging

- RDS PostgreSQL di private subnet
- ElastiCache Redis
- S3 untuk upload + CloudFront
- SQS/SNS untuk job async
- EventBridge vs Kafka

## Part 4 — Compute modern

- ECS + Fargate + ECR
- Lambda + API Gateway
- EKS + IRSA
- Autoscaling & blue/green

## Part 5 — Observability

- CloudWatch metrics/logs/alarms
- Sentry untuk error aplikasi
- Grafana + Prometheus
- OpenTelemetry tracing
- SLO & error budget

## Project latihan

1. **Containerized web app** — repo ini (Part 1).
2. **CI/CD pipeline** — tambahkan test + staging environment.
3. **Terraform modules** — pisahkan `network`, `compute`, `dns`.
4. **Kubernetes deployment** — k3s/EKS + Helm + cert-manager.
5. **Monitoring** — alert CPU, 5xx, health check eksternal.
6. **Blue/green** — dua target group ALB, switch DNS/weight.
7. **Multi-AZ** — RDS + Auto Scaling Group + ALB.
8. **Cost dashboard** — Budgets + Cost Explorer + tagging.

## Kebiasaan yang membedakan

- Selalu punya health check.
- Selalu bisa rollback.
- Selalu batasi port & IAM.
- Selalu tag resource.
- Selalu destroy lab.
- Dokumentasikan keputusan (ADR), bukan hanya perintah.

## Referensi belajar

- roadmap.sh/devops
- AWS Well-Architected Framework
- Docker docs — multi-stage builds
- Next.js self-hosting
- Terraform AWS provider docs
- Helm best practices
