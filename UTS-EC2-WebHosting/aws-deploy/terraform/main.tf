terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# ------------------------------------------------------------------
# Data: Ubuntu 24.04 LTS (Canonical) atau Amazon Linux 2023
# ------------------------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Alternative AMI untuk Amazon Linux 2023 (jika lebih disukai)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_vpc" "default" {
  default = true
}

# ------------------------------------------------------------------
# Key Pair (dibuat otomatis + file .pem lokal)
# ------------------------------------------------------------------
resource "tls_private_key" "ec2" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "ec2" {
  key_name   = var.key_name
  public_key = tls_private_key.ec2.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.ec2.private_key_openssh
  filename        = "${path.module}/keys/${var.key_name}.pem"
  file_permission = "0400"
}

# ------------------------------------------------------------------
# Security Group: SSH 22 (admin) + HTTP 80 (internet) + HTTPS 443
# ------------------------------------------------------------------
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "UTS Cloud Computing: SSH dari admin, HTTP/HTTPS dari internet"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH hanya dari IP admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  ingress {
    description = "HTTP dari internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS dari internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Semua outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-web-sg"
    Project = var.project_name
  }
}

# ------------------------------------------------------------------
# EC2 Instance
# ------------------------------------------------------------------
resource "aws_instance" "web" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.ec2.key_name
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true
  user_data                   = file("${path.module}/user-data.sh")
  user_data_replace_on_change = true

  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
  }

  tags = {
    Name    = "${var.project_name}-web"
    Project = var.project_name
    Tugas   = "UTS Cloud Computing"
  }
}

# ------------------------------------------------------------------
# Elastic IP (Public IP stabil)
# ------------------------------------------------------------------
resource "aws_eip" "web" {
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}

resource "aws_eip_association" "web" {
  instance_id   = aws_instance.web.id
  allocation_id = aws_eip.web.id
}

# ------------------------------------------------------------------
# Outputs: untuk script cleanup dan deployment
# ------------------------------------------------------------------
output "instance_id" {
  description = "ID instance EC2 (untuk cleanup)"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "IP publik Elastic IP"
  value       = aws_eip.web.public_ip
}

output "public_dns" {
  description = "DNS publik instance"
  value       = aws_instance.web.public_dns
}

output "eip_allocation_id" {
  description = "Allocation ID Elastic IP (untuk cleanup)"
  value       = aws_eip.web.id
}

output "ssh_command" {
  description = "Perintah SSH untuk akses instance"
  value       = "ssh -i ${path.module}/keys/${var.key_name}.pem ubuntu@${aws_eip.web.public_ip}"
}
