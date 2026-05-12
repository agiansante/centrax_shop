variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "eu-south-1"
}

variable "project_name" {
  description = "Project name used for resource tags."
  type        = string
  default     = "dropship-intel"
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.small"
}

variable "ssh_key_name" {
  description = "Existing AWS EC2 key pair name."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH into the VM."
  type        = string
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size."
  type        = number
  default     = 40
}
