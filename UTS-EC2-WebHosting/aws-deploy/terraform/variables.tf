variable "region" {
  description = "Region AWS"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Nama proyek (dipakai untuk nama resource)"
  type        = string
  default     = "uts-cloud-computing"
}

variable "instance_type" {
  description = "Tipe instance EC2 (free tier: t3.micro)"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Nama key pair EC2"
  type        = string
  default     = "uts-ec2-aryaf"
}

variable "ssh_cidr" {
  description = "CIDR /32 yang boleh SSH ke port 22 (wajib: IP admin, contoh 180.247.56.204/32)"
  type        = string

  validation {
    condition     = can(regex("^([0-9]{1,3}\\.){3}[0-9]{1,3}/32$", var.ssh_cidr))
    error_message = "ssh_cidr wajib berupa satu alamat IPv4 dengan prefix /32, misalnya 180.247.56.204/32."
  }
}

variable "root_volume_size" {
  description = "Ukuran root volume dalam GB"
  type        = number
  default     = 16
}
