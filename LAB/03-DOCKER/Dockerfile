# =====================================================================
#  Dockerfile — website statis UTS Cloud Computing
#  Build dari root proyek tugas:
#    docker build -t uts-web -f LAB/03-DOCKER/Dockerfile .
#  Atau cukup lewat docker-compose.
# =====================================================================
FROM nginx:stable-alpine

LABEL org.opencontainers.image.title="UTS Cloud Computing Web"
LABEL org.opencontainers.image.authors="Muhammad Arya Fatthurahman (2023230006)"

# Salin konfigurasi nginx (cache, security header, gzip)
COPY LAB/03-DOCKER/nginx.conf /etc/nginx/conf.d/default.conf

# Salin seluruh isi website (index.html, assets/)
COPY --chown=nginx:nginx index.html /usr/share/nginx/html/index.html
COPY --chown=nginx:nginx assets /usr/share/nginx/html/assets

# nginx:stable-alpine listen 80 default
EXPOSE 80

# healthcheck: pastikan web server responsif
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
