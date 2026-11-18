variable "aws_region" {
  description = "Region AWS, mis. us-east-1 / ap-southeast-1 (Singapore)"
  type        = string
  default     = "us-east-1"
}

variable "allowed_ssh_cidr" {
  description = "IP/CIDR yang boleh SSH ke instance. GANTI dengan IP Anda: curl ifconfig.me"
  type        = string
  default     = "0.0.0.0/0" # ⚠️ WAJIB diganti ke IP Anda, mis. 103.x.x.x/32
}

variable "allowed_http_cidr" {
  description = "CIDR yang boleh akses HTTP 80"
  type        = string
  default     = "0.0.0.0/0"
}

variable "key_name" {
  description = "Nama key pair EC2 yang SUDAH ADA di akun AWS Anda"
  type        = string
}

variable "instance_type" {
  description = "Tipe instance (free tier: t3.micro / t2.micro)"
  type        = string
  default     = "t3.micro"
}

variable "project_name" {
  description = "Prefix nama resource"
  type        = string
  default     = "uts-ec2"
}
