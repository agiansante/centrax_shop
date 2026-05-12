output "public_ip" {
  value = aws_instance.app.public_ip
}

output "ansible_inventory" {
  value = "[dropship_intel]\n${aws_instance.app.public_ip} ansible_user=ubuntu"
}
