terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Untuk tim: pindahkan state ke S3 + DynamoDB lock.
  # backend "s3" {
  #   bucket         = "my-terraform-state"
  #   key            = "ec2-web-hosting/terraform.tfstate"
  #   region         = "ap-southeast-3"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}
