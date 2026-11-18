#!/usr/bin/env bash
# ------------------------------------------------------------------
# Script cleanup resource AWS setelah UTS selesai
#   PERINGATAN: Script ini akan TERMINATE instance dan release Elastic IP
#   Pastikan instance yang ingin di-hapus benar
#   Penggunaan:
#     export AWS_REGION="ap-southeast-1"
#     export INSTANCE_ID="i-xxxxxxxxxxxxxxxxx"
#     export ALLOCATION_ID="eipalloc-xxxxxxxxxxxxxxxxx"
#     bash scripts/cleanup-aws.sh
# ------------------------------------------------------------------
set -euo pipefail

# Konfigurasi
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
INSTANCE_ID="${INSTANCE_ID:-}"
ALLOCATION_ID="${ALLOCATION_ID:-}"

# Validasi
if [[ -z "${INSTANCE_ID}" ]]; then
  echo "Error: INSTANCE_ID belum diset."
  echo "  Cari ID dengan: aws ec2 describe-instances --region ${AWS_REGION} --query 'Reservations[*].Instances[*].[InstanceId,State.Name,Tags[?Key==`Name`].Value]' --output table"
  exit 1
fi

echo "=== Cleanup Resource AWS ==="
echo "Region: ${AWS_REGION}"
echo "Instance ID: ${INSTANCE_ID}"
echo "Allocation ID: ${ALLOCATION_ID:-'(belum diset, akan dilewati)'}"
echo

# Konfirmasi keras
echo "PERINGATAN: Tindakan ini akan:"
echo "  1. Stop instance ${INSTANCE_ID}"
echo "  2. Terminate instance (data tidak bisa dipulihkan)"
echo "  3. Release Elastic IP jika ALLOCATION_ID diset"
echo
read -p "Lanjutkan? Ketik 'YA' untuk konfirmasi: " -r
echo
if [[ ! $REPLY == "YA" ]]; then
  echo "Dibatalkan."
  exit 0
fi

# 1. Stop instance
echo "[1/4] Stop instance..."
aws ec2 stop-instances \
  --region "${AWS_REGION}" \
  --instance-ids "${INSTANCE_ID}" \
  --output text

echo "Menunggu instance stopped..."
aws ec2 wait instance-stopped \
  --region "${AWS_REGION}" \
  --instance-ids "${INSTANCE_ID}"

# 2. Release Elastic IP jika ada
if [[ -n "${ALLOCATION_ID}" ]]; then
  echo "[2/4] Release Elastic IP..."
  aws ec2 release-address \
    --region "${AWS_REGION}" \
    --allocation-id "${ALLOCATION_ID}" \
    --output text
else
  echo "[2/4] Lewati release Elastic IP (ALLOCATION_ID kosong)"
fi

# 3. Terminate instance
echo "[3/4] Terminate instance..."
aws ec2 terminate-instances \
  --region "${AWS_REGION}" \
  --instance-ids "${INSTANCE_ID}" \
  --output text

echo "Menunggu instance terminated..."
aws ec2 wait instance-terminated \
  --region "${AWS_REGION}" \
  --instance-ids "${INSTANCE_ID}"

# 4. Cek volume yang masih available
echo "[4/4] Cek volume yang masih available..."
VOLUMES=$(aws ec2 describe-volumes \
  --region "${AWS_REGION}" \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size]' \
  --output text)

if [[ -n "${VOLUMES}" ]]; then
  echo "Volume yang masih available (perlu dihapus manual):"
  echo "${VOLUMES}"
  echo
  echo "Hapus dengan:"
  for vol_id in $(echo "${VOLUMES}" | awk '{print $1}'); do
    echo "  aws ec2 delete-volume --region ${AWS_REGION} --volume-id ${vol_id}"
  done
else
  echo "Tidak ada volume available yang tersisa."
fi

echo
echo "✓ Cleanup selesai."
echo "  Instance ${INSTANCE_ID} telah di-terminate."
echo "  Periksa billing untuk memastikan tidak ada resource yang menagih."
