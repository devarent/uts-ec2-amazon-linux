variable "aws_region" {
  description = "Region AWS (LocalStack tetap memakai nama region ini)"
  type        = string
  default     = "us-east-1"
}

variable "localstack_endpoint" {
  description = "Endpoint LocalStack"
  type        = string
  default     = "http://localhost:4566"
}

variable "project_name" {
  description = "Nama proyek (dipakai untuk tag & nama resource)"
  type        = string
  default     = "uts-cloud"
}

variable "ami_id" {
  description = "AMI tiruan untuk LocalStack (LocalStack tidak peduli ID-nya valid atau tidak)"
  type        = string
  default     = "ami-12345678"
}

variable "instance_type" {
  description = "Tipe instance"
  type        = string
  default     = "t3.micro"
}
