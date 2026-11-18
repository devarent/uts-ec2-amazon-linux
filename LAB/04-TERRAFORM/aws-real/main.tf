# =====================================================================
#  AWS-REAL — provision EC2 asli (Ubuntu 24.04) + Apache2 via Terraform
#  Memakai default VPC agar tidak perlu NAT Gateway/IGW tambahan.
# =====================================================================
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 7.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "Terraform"
      Mahasiswa = "Muhammad Arya Fatthurahman — NIM 2023230006"
    }
  }
}

# ---------- AMI terbaru Ubuntu Server 24.04 (noble) ----------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ---------- Default VPC & subnet public ----------
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "map-public-ip-on-launch"
    values = ["true"]
  }
}

locals {
  subnet_id = tolist(data.aws_subnets.public.ids)[0]
}

# ---------- Security Group: 22 (admin) + 80 (publik) ----------
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "UTS: SSH dari admin, HTTP publik"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH (batasi ke IP Anda; 0.0.0.0/0 hanya untuk IT quora)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "HTTP publik"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-web-sg" }
}

# ---------- Instance EC2 ----------
resource "aws_instance" "web" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = local.subnet_id
  key_name                    = var.key_name
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true

  user_data_replace_on_change = true
  user_data                   = templatefile("${path.module}/user_data.sh", {})

  tags = { Name = "${var.project_name}-web" }
}

