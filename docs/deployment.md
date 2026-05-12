# Deploy produzione AWS

## Terraform

```powershell
cd infra/aws
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
terraform output ansible_inventory
```

Salva l'output inventory in `infra/ansible/inventory.ini`.

## Ansible

```powershell
Copy-Item .env.production.example .env.production
ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml
```

La VM esegue Docker Compose in `/opt/dropship-intel`.

## Immagini

La configurazione produzione si aspetta immagini Docker indicate in `.env.production`:

- `BACKEND_IMAGE`
- `FRONTEND_IMAGE`

Per un primo deploy manuale si possono buildare e caricare immagini sul registry preferito, poi aggiornare `.env.production`.
