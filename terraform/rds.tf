# ------------------------------------------------------------------
# AWS RDS PostgreSQL Configuration
# This file adds managed database infrastructure to your Terraform setup
# Only created if rds_master_password is provided
# ------------------------------------------------------------------

# Database subnet group for RDS
resource "aws_db_subnet_group" "main" {
  count      = local.use_rds ? 1 : 0
  name       = "${local.name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${local.name}-db-subnet-group"
  }
}

# Security group for RDS - only accessible from EC2
resource "aws_security_group" "rds" {
  count       = local.use_rds ? 1 : 0
  name_prefix = "${local.name}-rds-"
  description = "PostgreSQL RDS - only accessible from EC2 instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${local.name}-rds"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Allow PostgreSQL access from EC2 security group
resource "aws_vpc_security_group_ingress_rule" "rds_from_ec2" {
  count = local.use_rds ? 1 : 0

  security_group_id            = aws_security_group.rds[0].id
  description                  = "PostgreSQL from EC2 instances"
  referenced_security_group_id = aws_security_group.web.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

# Egress for RDS (for updates, backups, etc.)
resource "aws_vpc_security_group_egress_rule" "rds_all" {
  count = local.use_rds ? 1 : 0

  security_group_id = aws_security_group.rds[0].id
  description       = "Egress for RDS operations"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# RDS PostgreSQL instance
resource "aws_db_instance" "main" {
  count = local.use_rds ? 1 : 0

  identifier = "${local.name}-postgres"

  # Engine configuration
  engine         = "postgres"
  engine_version = var.rds_postgres_version
  instance_class = var.rds_instance_class

  # Storage configuration
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database configuration
  db_name  = var.rds_database_name
  username = var.rds_master_username
  password = var.rds_master_password

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.rds[0].id]
  publicly_accessible    = false
  multi_az               = var.rds_multi_az

  # Backup configuration
  backup_retention_period = var.rds_backup_retention_period
  backup_window           = "03:00-04:00"         # UTC
  maintenance_window      = "sun:04:00-sun:05:00" # UTC

  # Monitoring
  enabled_cloudwatch_logs_exports       = ["postgresql"]
  performance_insights_enabled          = var.rds_performance_insights
  performance_insights_retention_period = var.rds_performance_insights ? 7 : null

  # Security
  deletion_protection       = var.rds_deletion_protection
  skip_final_snapshot       = var.rds_skip_final_snapshot
  final_snapshot_identifier = var.rds_skip_final_snapshot ? null : "${local.name}-final-snapshot"

  # Parameter group for PostgreSQL optimizations
  parameter_group_name = aws_db_parameter_group.postgres[0].name

  # Option group for PostgreSQL
  option_group_name = aws_db_option_group.postgres[0].name

  tags = {
    Name = "${local.name}-postgres"
  }

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = false # Set to true in production
    ignore_changes  = [password]
  }
}

# PostgreSQL parameter group for performance tuning
resource "aws_db_parameter_group" "postgres" {
  count  = local.use_rds ? 1 : 0
  name   = "${local.name}-postgres-params"
  family = "postgres${split(".", var.rds_postgres_version)[0]}"

  # Performance parameters
  parameter {
    name  = "shared_buffers"
    value = "256MB" # 25% of RAM for t3.micro
  }

  parameter {
    name  = "effective_cache_size"
    value = "768MB" # 75% of RAM
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "64MB"
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "16MB"
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1" # Lower for SSD
  }

  parameter {
    name  = "effective_io_concurrency"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "4MB"
  }

  parameter {
    name  = "min_wal_size"
    value = "1GB"
  }

  parameter {
    name  = "max_wal_size"
    value = "4GB"
  }

  tags = {
    Name = "${local.name}-postgres-params"
  }
}

# PostgreSQL option group
resource "aws_db_option_group" "postgres" {
  count                    = local.use_rds ? 1 : 0
  name                     = "${local.name}-postgres-options"
  option_group_description = "PostgreSQL option group for ${local.name}"
  engine_name              = "postgres"
  major_engine_version     = split(".", var.rds_postgres_version)[0]

  tags = {
    Name = "${local.name}-postgres-options"
  }
}
