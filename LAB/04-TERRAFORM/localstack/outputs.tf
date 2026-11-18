output "vpc_id" {
  value = aws_vpc.main.id
}

output "subnet_id" {
  value = aws_subnet.public.id
}

output "instance_id" {
  value = aws_instance.web.id
}

output "public_ip" {
  value = aws_instance.web.public_ip
}

output "private_ip" {
  value = aws_instance.web.private_ip
}

output "security_group_id" {
  value = aws_security_group.web.id
}

output "s3_bucket" {
  value = aws_s3_bucket.artifact.bucket
}

output "ls_endpoint" {
  value = var.localstack_endpoint
}
