variable "aws_region" {
  description = "Region AWS. ap-southeast-3 = Jakarta."
  type        = string
  default     = "ap-southeast-3"
}

variable "project_name" {
  description = "Prefix nama resource."
  type        = string
  default     = "ec2-web-hosting"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,32}$", var.project_name))
    error_message = "project_name harus 3-32 karakter: huruf kecil, angka, atau tanda hubung."
  }
}

variable "environment" {
  description = "Label environment untuk tagging."
  type        = string
  default     = "lab"
}

variable "instance_type" {
  description = "Tipe EC2. t3.micro cukup untuk lab (1 vCPU, 1 GB)."
  type        = string
  default     = "t3.micro"
}

variable "vpc_cidr" {
  description = "CIDR VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Dua public subnet di AZ berbeda (Multi-AZ)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR subnet privat untuk RDS; minimal dua subnet di AZ berbeda."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) >= 2
    error_message = "private_subnet_cidrs harus berisi minimal dua subnet untuk RDS."
  }
}

variable "ssh_cidr" {
  description = "CIDR yang boleh SSH/PuTTY (port 22). Isi IP publik admin + /32. Kosongkan untuk SSM-only."
  type        = string
  default     = ""
}

variable "key_name" {
  description = "Nama key pair yang SUDAH ada di region ini. Kosongkan jika memakai ssh_public_key."
  type        = string
  default     = ""
}

variable "ssh_public_key" {
  description = "Isi public key untuk dibuatkan key pair baru, mis. file(\"~/.ssh/id_ed25519.pub\")."
  type        = string
  default     = ""
  sensitive   = false
}

variable "ami_id" {
  description = "Override AMI. Kosong = Amazon Linux 2023 x86_64 terbaru dari SSM public parameter."
  type        = string
  default     = ""
}

variable "root_volume_size" {
  description = "Ukuran disk root (GB)."
  type        = number
  default     = 20

  validation {
    condition     = var.root_volume_size >= 8 && var.root_volume_size <= 100
    error_message = "root_volume_size harus antara 8 dan 100 GB."
  }
}

variable "domain_name" {
  description = "FQDN aplikasi, mis. app.example.com. Kosongkan untuk melewati Route 53."
  type        = string
  default     = ""
}

variable "hosted_zone_name" {
  description = "Nama hosted zone Route 53, mis. example.com. Wajib jika domain_name diisi."
  type        = string
  default     = ""
}

variable "enable_detailed_monitoring" {
  description = "CloudWatch detailed monitoring (biaya tambahan kecil)."
  type        = bool
  default     = false
}

# ------------------------------------------------------------------
# RDS PostgreSQL Variables
# ------------------------------------------------------------------
variable "rds_postgres_version" {
  description = "PostgreSQL version for RDS instance."
  type        = string
  default     = "15.4"

  validation {
    condition     = can(regex("^1[4-6]\\.", var.rds_postgres_version))
    error_message = "rds_postgres_version harus versi 14, 15, atau 16."
  }
}

variable "rds_instance_class" {
  description = "RDS instance class. db.t3.micro is free tier eligible."
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Initial storage allocation in GB."
  type        = number
  default     = 20

  validation {
    condition     = var.rds_allocated_storage >= 20 && var.rds_allocated_storage <= 100
    error_message = "rds_allocated_storage harus antara 20 dan 100 GB."
  }
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage allocation in GB (for autoscaling)."
  type        = number
  default     = 100
}

variable "rds_database_name" {
  description = "Name of the database to create."
  type        = string
  default     = "ec2lab"
}

variable "rds_master_username" {
  description = "Master username for RDS instance."
  type        = string
  default     = "ec2lab_admin"
}

variable "rds_master_password" {
  description = "Master password for RDS instance. Should be strong and unique."
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.rds_master_password == "" || length(var.rds_master_password) >= 8
    error_message = "rds_master_password harus kosong (RDS nonaktif) atau minimal 8 karakter."
  }
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ deployment for high availability."
  type        = bool
  default     = false
}

variable "rds_backup_retention_period" {
  description = "Number of days to retain automated backups."
  type        = number
  default     = 7

  validation {
    condition     = var.rds_backup_retention_period >= 0 && var.rds_backup_retention_period <= 35
    error_message = "rds_backup_retention_period harus antara 0 dan 35 hari."
  }
}

variable "rds_performance_insights" {
  description = "Enable Performance Insights for RDS monitoring."
  type        = bool
  default     = true
}

variable "rds_deletion_protection" {
  description = "Enable deletion protection for RDS instance."
  type        = bool
  default     = true
}

variable "rds_skip_final_snapshot" {
  description = "Skip final snapshot when destroying RDS instance."
  type        = bool
  default     = false
}
