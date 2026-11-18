# =====================================================================
#  vm-local — Terraform mengonfigurasi VMware/VirtualBox lewat SSH
#  Cara kerja: file provisioner upload deploy.sh, remote-exec menjalankannya.
# =====================================================================
terraform {
  required_version = ">= 1.5.0"
}

variable "ssh_host" {
  description = "IP VM (Host-Only), mis. 192.168.56.10 (VM-1) atau 192.168.56.20 (VM-2)"
  type        = string
  default     = "192.168.56.10"
}

variable "ssh_user" {
  description = "User login VM: ec2-user (Amazon Linux) / ubuntu (Ubuntu)"
  type        = string
  default     = "ec2-user"
}

variable "ssh_private_key_path" {
  description = "Path ke private key lab"
  type        = string
  default     = "~/.ssh/lab_ec2"
}

variable "http_port" {
  type    = number
  default = 80
}

resource "terraform_data" "configure" {
  triggers_replace = [var.ssh_host, var.ssh_user, filesha1("${path.module}/deploy.sh")]

  connection {
    type        = "ssh"
    host        = var.ssh_host
    user        = var.ssh_user
    private_key = file(pathexpand(var.ssh_private_key_path))
    timeout     = "120s"
  }

  provisioner "file" {
    source      = "${path.module}/deploy.sh"
    destination = "/tmp/uts-deploy.sh"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /tmp/uts-deploy.sh",
      "/tmp/uts-deploy.sh",
      "curl -s -o /dev/null -w 'HTTP %%{http_code}\\n' http://localhost"
    ]
  }
}

output "vm_ip" {
  value = var.ssh_host
}

output "website_url" {
  value = "http://${var.ssh_host}:${var.http_port}"
}

output "ssh_command" {
  value = "ssh -i ${var.ssh_private_key_path} ${var.ssh_user}@${var.ssh_host}"
}
