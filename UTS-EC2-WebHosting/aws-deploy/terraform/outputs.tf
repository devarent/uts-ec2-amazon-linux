output "public_ip" {
  description = "Public IP (Elastic IP) — alamat website UTS"
  value       = aws_eip.web.public_ip
}

output "instance_id" {
  description = "ID instance EC2"
  value       = aws_instance.web.id
}

output "private_ip" {
  description = "Private IP EC2 (tidak bisa diakses dari internet)"
  value       = aws_instance.web.private_ip
}

output "ssh_command" {
  description = "Perintah SSH ke instance"
  value       = "ssh -i keys/${var.key_name}.pem ubuntu@${aws_eip.web.public_ip}"
}

output "website_url" {
  description = "URL website yang bisa dibuka di browser"
  value       = "http://${aws_eip.web.public_ip}"
}

output "security_group_id" {
  description = "ID Security Group"
  value       = aws_security_group.web.id
}
