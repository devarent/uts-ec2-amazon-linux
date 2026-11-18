# 03 — DOCKER

## Yang dipelajari

Membangun **container** untuk website statis — langkah pertama sebelum deploy ke ECS/EC2.

## Build & run (dari root proyek)

```powershell
cd "C:\laragon\www\UTS Ujian Tengah Semester EC2 Amazon Linux"
docker build -t uts-web -f LAB/03-DOCKER/Dockerfile .
docker run -d --name uts-web -p 8080:80 uts-web
start http://192.168.100.3:8080
docker logs -f uts-web
docker exec -it uts-web sh -c "ls -la /usr/share/nginx/html && cat /usr/share/nginx/html/index.html | head"
```

Atau compose:

```powershell
docker compose -f LAB/03-DOCKER/docker-compose.yml up -d --build
docker compose -f LAB/03-DOCKER/docker-compose.yml ps
```

## Di dalam VM (server asli)

```bash
# Amazon Linux 2023 (VM-1) — install docker:
sudo dnf install -y docker && sudo systemctl enable --now docker && sudo usermod -aG docker $USER
# Ubuntu 24.04 (VM-2) — sudah otomatis dari setup-webserver.sh

docker build -t uts-web -f LAB/03-DOCKER/Dockerfile .
docker run -d --name uts-web --restart=always -p 80:80 uts-web
curl -s -o /dev/null -w "%{http_code}\n" http://192.168.56.10
```

## Push ke registry lokal (simulasi ECR)

```bash
docker run -d -p 5000:5000 --name registry registry:2
docker tag uts-web:latest localhost:5000/uts-web:latest
docker push localhost:5000/uts-web:latest
docker pull localhost:5000/uts-web:latest
```

## Cleanup

```bash
docker stop uts-web && docker rm uts-web
docker compose -f LAB/03-DOCKER/docker-compose.yml down
docker image prune -f
```
