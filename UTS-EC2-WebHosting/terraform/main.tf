locals {
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Lab         = "aws-ec2-web-hosting-part-1"
  }

  name = "${var.project_name}-${var.environment}"

  create_dns = var.domain_name != "" && var.hosted_zone_name != ""

  ssh_key_name = var.key_name != "" ? var.key_name : try(aws_key_pair.generated[0].key_name, null)

  # Reveal only whether RDS is enabled; never expose the password value.
  use_rds = nonsensitive(var.rds_master_password != "")
}

# ------------------------------------------------------------------
# Data
# ------------------------------------------------------------------
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "debian" {
  count       = var.ami_id == "" ? 1 : 0
  most_recent = true
  owners      = ["136693071363"] # Debian official

  filter {
    name   = "name"
    values = ["debian-13-amd64-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

locals {
  ami_id = var.ami_id != "" ? var.ami_id : data.aws_ami.debian[0].id
}

# ------------------------------------------------------------------
# Network
# ------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${local.name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${local.name}-igw" }
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name}-public-${count.index + 1}"
    Tier = "public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${local.name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Isolated subnets have only the VPC-local route. RDS is not publicly
# accessible and does not need a NAT gateway for app-to-database traffic.
resource "aws_subnet" "private" {
  count = local.use_rds ? length(var.private_subnet_cidrs) : 0

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "${local.name}-private-${count.index + 1}"
    Tier = "private"
  }
}

# ------------------------------------------------------------------
# Security group
# ------------------------------------------------------------------
resource "aws_security_group" "web" {
  name_prefix = "${local.name}-web-"
  description = "HTTP/HTTPS publik, SSH terbatas, egress bebas"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${local.name}-web" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  count = var.ssh_cidr != "" ? 1 : 0

  security_group_id = aws_security_group.web.id
  description       = "SSH dari IP admin"
  cidr_ipv4         = var.ssh_cidr
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.web.id
  description       = "HTTP (redirect + ACME)"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.web.id
  description       = "HTTPS"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.web.id
  description       = "Egress bebas (apt, GHCR, Let's Encrypt)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ------------------------------------------------------------------
# IAM (SSM Session Manager + CloudWatch — tanpa access key)
# ------------------------------------------------------------------
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${local.name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json

  tags = { Name = "${local.name}-ec2-role" }
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = { Name = "${local.name}-ec2-profile" }
}

# ------------------------------------------------------------------
# Key pair (opsional)
# ------------------------------------------------------------------
resource "aws_key_pair" "generated" {
  count = var.key_name == "" && var.ssh_public_key != "" ? 1 : 0

  key_name   = "${local.name}-key"
  public_key = var.ssh_public_key

  tags = { Name = "${local.name}-key" }
}

# ------------------------------------------------------------------
# EC2 + Elastic IP
# ------------------------------------------------------------------
resource "aws_instance" "app" {
  ami                         = local.ami_id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.web.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  key_name                    = local.ssh_key_name
  associate_public_ip_address = true
  monitoring                  = var.enable_detailed_monitoring
  user_data = templatefile("${path.module}/user-data.sh", {
    app_dir = "/opt/app"
  })
  user_data_replace_on_change = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
  }

  tags = { Name = "${local.name}-app" }

  depends_on = [
    aws_iam_role_policy_attachment.ssm,
    aws_iam_role_policy_attachment.cloudwatch,
  ]
}

resource "aws_eip" "app" {
  tags = { Name = "${local.name}-eip" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}
