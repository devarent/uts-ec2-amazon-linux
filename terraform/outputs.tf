output "instance_id" {
  description = "ID instance EC2."
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Elastic IP (A record harus mengarah ke sini)."
  value       = aws_eip.app.public_ip
}

output "public_dns" {
  description = "Public DNS instance."
  value       = aws_instance.app.public_dns
}

output "app_url" {
  description = "URL aplikasi."
  value       = local.create_dns ? "https://${var.domain_name}" : "http://${aws_eip.app.public_ip}"
}

output "health_url" {
  description = "Endpoint health check."
  value       = local.create_dns ? "https://${var.domain_name}/api/health" : "http://${aws_eip.app.public_ip}/api/health"
}

output "ssh_command" {
  description = "Perintah SSH (butuh key yang sesuai)."
  value       = local.ssh_key_name != null ? "ssh -i <path-ke-key.pem> ec2-user@${aws_eip.app.public_ip}" : "Gunakan SSM Session Manager (tanpa port 22)."
}

output "putty_command" {
  description = "Perintah PuTTY (butuh private key .ppk dan ssh_cidr yang mengizinkan IP admin)."
  value       = local.ssh_key_name != null ? "putty.exe -ssh ec2-user@${aws_eip.app.public_ip} -i <path-ke-key.ppk>" : "PuTTY tidak aktif; gunakan SSM Session Manager atau siapkan key pair dan ssh_cidr."
}

output "ssm_command" {
  description = "Masuk lewat SSM tanpa membuka port 22."
  value       = "aws ssm start-session --target ${aws_instance.app.id} --region ${var.aws_region}"
}

output "dns_record" {
  description = "Record Route 53 yang dibuat (jika ada)."
  value       = local.create_dns ? "${var.domain_name} → ${aws_eip.app.public_ip}" : "Route 53 dilewati (domain_name/hosted_zone_name kosong)."
}

output "next_steps" {
  description = "Langkah setelah apply."
  value = join("\n", [
    "1. SSH/PuTTY ke Amazon Linux 2023 sebagai ec2-user (atau gunakan SSM).",
    "2. Clone repository ke /opt/app; Docker dan Compose v2 dipasang saat bootstrap.",
    "3. cp .env.example .env, isi DOMAIN + NEXT_PUBLIC_SITE_URL.",
    "4. Terbitkan sertifikat: DOMAIN=... EMAIL=... sudo -E bash scripts/issue-cert.sh",
    "5. docker compose up -d",
    "6. Buka ${local.create_dns ? "https://${var.domain_name}" : "http://${aws_eip.app.public_ip}"}",
  ])
}

# ------------------------------------------------------------------
# RDS Outputs (only if RDS is enabled)
# ------------------------------------------------------------------
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (hostname:port)."
  value       = local.use_rds ? aws_db_instance.main[0].endpoint : "RDS not enabled"
}

output "rds_address" {
  description = "RDS PostgreSQL address (hostname only)."
  value       = local.use_rds ? aws_db_instance.main[0].address : "RDS not enabled"
}

output "rds_port" {
  description = "RDS PostgreSQL port."
  value       = local.use_rds ? aws_db_instance.main[0].port : "RDS not enabled"
}

output "rds_database_name" {
  description = "RDS database name."
  value       = local.use_rds ? aws_db_instance.main[0].db_name : "RDS not enabled"
}

output "rds_master_username" {
  description = "RDS master username."
  value       = local.use_rds ? aws_db_instance.main[0].username : "RDS not enabled"
  sensitive   = true
}

output "rds_connection_string" {
  description = "PostgreSQL connection string for DATABASE_URL."
  value       = local.use_rds ? "postgresql://${aws_db_instance.main[0].username}:${var.rds_master_password}@${aws_db_instance.main[0].endpoint}/${aws_db_instance.main[0].db_name}" : "RDS not enabled"
  sensitive   = true
}

output "rds_security_group_id" {
  description = "RDS security group ID."
  value       = local.use_rds ? aws_security_group.rds[0].id : "RDS not enabled"
}

output "rds_subnet_group_name" {
  description = "RDS subnet group name."
  value       = local.use_rds ? aws_db_subnet_group.main[0].name : "RDS not enabled"
}

output "rds_backup_retention" {
  description = "RDS backup retention period in days."
  value       = local.use_rds ? aws_db_instance.main[0].backup_retention_period : "RDS not enabled"
}

output "rds_multi_az" {
  description = "RDS Multi-AZ deployment status."
  value       = local.use_rds ? aws_db_instance.main[0].multi_az : "RDS not enabled"
}

output "rds_performance_insights" {
  description = "RDS Performance Insights status."
  value       = local.use_rds ? aws_db_instance.main[0].performance_insights_enabled : "RDS not enabled"
}

output "rds_deletion_protection" {
  description = "RDS deletion protection status."
  value       = local.use_rds ? aws_db_instance.main[0].deletion_protection : "RDS not enabled"
}

output "rds_encrypted" {
  description = "RDS storage encryption status."
  value       = local.use_rds ? aws_db_instance.main[0].storage_encrypted : "RDS not enabled"
}

output "rds_arn" {
  description = "RDS instance ARN."
  value       = local.use_rds ? aws_db_instance.main[0].arn : "RDS not enabled"
}

output "rds_status" {
  description = "RDS instance status."
  value       = local.use_rds ? aws_db_instance.main[0].status : "RDS not enabled"
}

output "rds_engine_version" {
  description = "RDS PostgreSQL engine version."
  value       = local.use_rds ? aws_db_instance.main[0].engine_version : "RDS not enabled"
}

output "rds_instance_class" {
  description = "RDS instance class."
  value       = local.use_rds ? aws_db_instance.main[0].instance_class : "RDS not enabled"
}

output "rds_allocated_storage" {
  description = "RDS allocated storage in GB."
  value       = local.use_rds ? aws_db_instance.main[0].allocated_storage : "RDS not enabled"
}

output "rds_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB."
  value       = local.use_rds ? aws_db_instance.main[0].max_allocated_storage : "RDS not enabled"
}

output "rds_backup_window" {
  description = "RDS backup window (UTC)."
  value       = local.use_rds ? aws_db_instance.main[0].backup_window : "RDS not enabled"
}

output "rds_maintenance_window" {
  description = "RDS maintenance window (UTC)."
  value       = local.use_rds ? aws_db_instance.main[0].maintenance_window : "RDS not enabled"
}

output "rds_cloudwatch_logs" {
  description = "RDS CloudWatch logs exports."
  value       = local.use_rds ? aws_db_instance.main[0].enabled_cloudwatch_logs_exports : "RDS not enabled"
}

output "rds_parameter_group" {
  description = "RDS parameter group name."
  value       = local.use_rds ? aws_db_parameter_group.postgres[0].name : "RDS not enabled"
}

output "rds_option_group" {
  description = "RDS option group name."
  value       = local.use_rds ? aws_db_option_group.postgres[0].name : "RDS not enabled"
}
