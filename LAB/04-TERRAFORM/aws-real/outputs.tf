output "instance_id" {
  description = "ID instance EC2"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "Public IPv4 — masukkan ke deskripsi YouTube & demo video"
  value       = aws_instance.web.public_ip
}

output "public_dns" {
  description = "Public DNS instance"
  value       = aws_instance.web.public_dns
}

output "private_ip" {
  description = "Private IPv4 (internal VPC)"
  value       = aws_instance.web.private_ip
}

output "url_website" {
  description = "URL website UTS"
  value       = "http://${aws_instance.web.public_ip}"
}

output "ssh_command" {
  description = "Perintah SSH (ganti path key Anda)"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_instance.web.public_ip}"
}
