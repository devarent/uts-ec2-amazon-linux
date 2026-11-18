# =====================================================================
#  main.tf — SIMULASI AWS VPC + Security Group + EC2 (LocalStack)
#  Ini menirukan apa yang dilakukan di AWS Console secara manual.
#  Jalankan:
#    docker compose up -d
#    cd 04-TERRAFORM/localstack && terraform init && terraform apply -auto-approve
#    aws --endpoint-url=http://localhost:4566 ec2 describe-instances
#    terraform destroy
# =====================================================================

# ---------- 1. VPC ----------
resource "aws_vpc" "main" {
  cidr_block           = "10.10.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${var.project_name}-vpc" }
}

# ---------- 2. Subnet publik (public) ----------
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.10.1.0/24"
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-public" }
}

# ---------- 3. Internet Gateway ----------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-igw" }
}

# ---------- 4. Route table publik: 0.0.0.0/0 -> IGW ----------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ---------- 5. Security Group: SSH 22 (dari IP admin) + HTTP 80 (publik) ----------
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Web server: SSH dari admin, HTTP dari internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH dari mana saja (dibatasi di production!)"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP publik"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-web-sg" }
}

# ---------- 6. Key pair tiruan ----------
resource "aws_key_pair" "demo" {
  key_name   = "${var.project_name}-key"
  public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICmya/KZYg4RwrfwPyy43CoCf67N3RQzUsMKeDsknkh7 uts-localstack-demo"
}

# ---------- 7. Instance EC2 (tiruan) ----------
resource "aws_instance" "web" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  key_name                    = aws_key_pair.demo.key_name
  vpc_security_group_ids      = [aws_security_group.web.id]
  associate_public_ip_address = true

  user_data = <<-EOT
    #!/bin/bash
    set -eux
    dnf update -y
    dnf install -y httpd
    systemctl enable --now httpd
    echo "<h1>Muhammad Arya Fatthurahman — NIM 2023230006</h1>" > /usr/share/httpd/html/index.html
  EOT

  tags = {
    Name    = "${var.project_name}-web"
    Purpose = "UTS Cloud Computing"
  }
}

# ---------- 8. S3 bucket (untuk penyimpanan artefak) ----------
resource "aws_s3_bucket" "artifact" {
  bucket = "${var.project_name}-artifact-2023230006"
}
