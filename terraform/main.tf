terraform {
  required_version = ">= 1.6.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-1"
}


# Adopt the existing Panel AI server in Singapore.
import {
  to = aws_instance.app
  id = "i-05b0769891faa21d2"
}

# Match the existing instance settings before applying the import plan.
resource "aws_instance" "app" {
  ami                    = "ami-0532913178263be11"
  instance_type          = "t3.small" # t3.micro was not enough for this app's Kubernetes workload.
  subnet_id              = "subnet-0794678176da0c2a9"
  key_name               = "panelai"
  vpc_security_group_ids = ["sg-09b0e803f91146f78"] # Include all currently attached groups.

  # IAM role uses this name.
  iam_instance_profile = "panelai-prod-ec2-role"

  lifecycle {
    prevent_destroy = true
  }
}