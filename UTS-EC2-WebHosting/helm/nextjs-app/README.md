# Dependencies chart (opsional)
# Untuk Ingress TLS otomatis di cluster:
#   helm repo add jetstack https://charts.jetstack.io
#   helm upgrade --install cert-manager jetstack/cert-manager \
#     --namespace cert-manager --create-namespace \
#     --set crds.enabled=true
#
# Ingress controller (k3s sudah punya Traefik; contoh ini pakai ingress-nginx):
#   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
#   helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
#     --namespace ingress-nginx --create-namespace
