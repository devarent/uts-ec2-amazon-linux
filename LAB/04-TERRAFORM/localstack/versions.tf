# =====================================================================
#  versions.tf — pin versi terraform + provider AWS
# =====================================================================
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 7.0"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  access_key                  = "test" # dummy: LocalStack menerima apa saja
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    ec2            = var.localstack_endpoint
    s3             = var.localstack_endpoint
    iam            = var.localstack_endpoint
    sts            = var.localstack_endpoint
    apigatewayv2   = var.localstack_endpoint
    secretsmanager = var.localstack_endpoint
    cloudformation = var.localstack_endpoint
    logs           = var.localstack_endpoint
  }

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "Terraform"
      Owner     = "Muhammad Arya Fatthurahman NIM 2023230006"
    }
  }
}

