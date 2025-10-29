# Deploy no Oracle Cloud - Vértice GitHub Bot

> **Honoring JESUS through cloud excellence! 🙏**

Guia completo para deploy do Vértice GitHub Bot no **Oracle Cloud Infrastructure (OCI) Free Tier**.

## Por que Oracle Cloud?

O Oracle Cloud oferece um dos **melhores free tiers permanentes** do mercado:

```
✅ SEMPRE GRÁTIS (não expira):
  • 2 VMs AMD (1 OCPU, 1GB RAM cada)
  • 4 VMs ARM Ampere (até 24GB RAM total!)
  • 200GB Block Storage
  • 10GB Object Storage
  • 2 Autonomous Databases (20GB cada)
  • Load Balancer
  • Networking completo
```

Para nosso bot, vamos usar: **1 VM ARM Ampere (4 OCPU, 24GB RAM)** - GRÁTIS PARA SEMPRE! 🎉

---

## Pré-requisitos

1. ✅ Conta Oracle Cloud (criar em: https://cloud.oracle.com/free)
2. ✅ Cartão de crédito (apenas verificação - não será cobrado)
3. ✅ Terminal Linux/Mac ou WSL no Windows

---

## Parte 1: Configurar OCI CLI

### 1. Instalar OCI CLI

**Linux/Mac:**
```bash
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
```

**Com auto-aceitar (recomendado):**
```bash
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)" -- --accept-all-defaults
```

**Windows (PowerShell como Admin):**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1'))
```

**Mac (Homebrew):**
```bash
brew install oci-cli
```

### 2. Verificar Instalação

```bash
oci --version
# Output esperado: x.x.x
```

### 3. Configurar OCI CLI

```bash
oci setup config
```

Você precisará fornecer (todas as informações estão no console Oracle Cloud):

1. **User OCID**: Console → Profile → User Settings → OCID (copiar)
2. **Tenancy OCID**: Console → Profile → Tenancy → OCID (copiar)
3. **Region**: Escolha sua região (ex: `us-ashburn-1`, `sa-saopaulo-1`)
4. **API Key**: O CLI irá gerar automaticamente

**IMPORTANTE**: Após gerar a chave, o CLI mostrará uma public key. Você precisa:
1. Copiar a public key mostrada
2. Ir em: Console → Profile → User Settings → API Keys → Add API Key
3. Colar a public key
4. Salvar

### 4. Testar Conexão

```bash
oci iam region list --output table
```

Se mostrar lista de regiões, está configurado! ✅

---

## Parte 2: Criar VM no Oracle Cloud

### 1. Criar Compartment (Opcional mas Recomendado)

```bash
# Listar compartments existentes
oci iam compartment list

# Criar novo compartment para o bot
oci iam compartment create \
  --compartment-id <seu-tenancy-ocid> \
  --name "vertice-github-bot" \
  --description "Compartment for Vértice GitHub Bot"
```

### 2. Criar VCN (Virtual Cloud Network)

```bash
# Criar VCN
oci network vcn create \
  --compartment-id <compartment-ocid> \
  --display-name "vertice-bot-vcn" \
  --cidr-block "10.0.0.0/16" \
  --dns-label "verticebotvcn"

# Anotar o VCN OCID do output
```

### 3. Criar Subnet

```bash
# Criar subnet pública
oci network subnet create \
  --compartment-id <compartment-ocid> \
  --vcn-id <vcn-ocid> \
  --display-name "vertice-bot-subnet" \
  --cidr-block "10.0.1.0/24" \
  --dns-label "verticebotsubnet"

# Anotar o Subnet OCID
```

### 4. Criar Internet Gateway

```bash
# Criar Internet Gateway
oci network internet-gateway create \
  --compartment-id <compartment-ocid> \
  --vcn-id <vcn-ocid> \
  --display-name "vertice-bot-igw" \
  --is-enabled true

# Anotar o IGW OCID
```

### 5. Configurar Route Table

```bash
# Pegar Route Table ID da VCN
oci network route-table list \
  --compartment-id <compartment-ocid> \
  --vcn-id <vcn-ocid>

# Adicionar rota para Internet Gateway
oci network route-table update \
  --rt-id <route-table-ocid> \
  --route-rules '[{"destination": "0.0.0.0/0", "networkEntityId": "<igw-ocid>"}]' \
  --force
```

### 6. Criar Security List (Firewall)

```bash
# Pegar Security List ID
oci network security-list list \
  --compartment-id <compartment-ocid> \
  --vcn-id <vcn-ocid>

# Atualizar regras (permitir SSH, HTTP, HTTPS, App)
oci network security-list update \
  --security-list-id <security-list-ocid> \
  --ingress-security-rules '[
    {
      "source": "0.0.0.0/0",
      "protocol": "6",
      "tcpOptions": {"destinationPortRange": {"min": 22, "max": 22}},
      "description": "SSH"
    },
    {
      "source": "0.0.0.0/0",
      "protocol": "6",
      "tcpOptions": {"destinationPortRange": {"min": 80, "max": 80}},
      "description": "HTTP"
    },
    {
      "source": "0.0.0.0/0",
      "protocol": "6",
      "tcpOptions": {"destinationPortRange": {"min": 443, "max": 443}},
      "description": "HTTPS"
    },
    {
      "source": "0.0.0.0/0",
      "protocol": "6",
      "tcpOptions": {"destinationPortRange": {"min": 3000, "max": 3000}},
      "description": "NestJS App"
    }
  ]' \
  --force
```

### 7. Criar Chave SSH

```bash
# Criar par de chaves SSH
ssh-keygen -t rsa -b 4096 -f ~/.ssh/oci_vertice_bot

# Visualizar chave pública (copiar para próximo passo)
cat ~/.ssh/oci_vertice_bot.pub
```

### 8. Criar VM ARM Ampere (24GB RAM - GRÁTIS!)

```bash
# Listar shapes ARM disponíveis
oci compute shape list \
  --compartment-id <compartment-ocid> \
  --availability-domain <AD> | grep -i ampere

# Listar imagens Oracle Linux 8 ARM
oci compute image list \
  --compartment-id <compartment-ocid> \
  --operating-system "Oracle Linux" \
  --operating-system-version "8" \
  --shape "VM.Standard.A1.Flex" \
  --output table

# Criar instância ARM Ampere (4 OCPU, 24GB RAM)
oci compute instance launch \
  --compartment-id <compartment-ocid> \
  --availability-domain <AD> \
  --shape "VM.Standard.A1.Flex" \
  --shape-config '{"ocpus": 4, "memoryInGBs": 24}' \
  --display-name "vertice-github-bot-vm" \
  --image-id <image-ocid> \
  --subnet-id <subnet-ocid> \
  --assign-public-ip true \
  --ssh-authorized-keys-file ~/.ssh/oci_vertice_bot.pub

# Anotar o Instance OCID e aguardar status RUNNING
```

**IMPORTANTE**: Se der erro de "Out of capacity", tente:
- Outras availability domains na mesma região
- Ou use shape menor: `{"ocpus": 2, "memoryInGBs": 12}`
- Ou tente em horários diferentes (demanda varia)

### 9. Obter IP Público

```bash
# Listar VNICs da instância
oci compute instance list-vnics \
  --instance-id <instance-ocid>

# Anotar o Public IP
```

---

## Parte 3: Configurar VM

### 1. Conectar via SSH

```bash
ssh -i ~/.ssh/oci_vertice_bot opc@<public-ip>
```

### 2. Atualizar Sistema

```bash
sudo dnf update -y
```

### 3. Instalar Docker

```bash
# Instalar Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Caso não encontre, adicionar repo Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker opc
newgrp docker

# Verificar
docker --version
docker compose version
```

### 4. Instalar Git e Node.js

```bash
# Git
sudo dnf install -y git

# Node.js 20 (via NodeSource)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Verificar
node --version
pnpm --version
```

### 5. Configurar Firewall da VM

```bash
# Abrir portas no firewall local
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# Verificar
sudo firewall-cmd --list-all
```

---

## Parte 4: Deploy da Aplicação

### 1. Clonar Repositório

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/vertice-github-bot.git
cd vertice-github-bot
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

Configurar:
```env
# Database (usaremos PostgreSQL do Docker)
DATABASE_URL="postgresql://vertice:YOUR_SECURE_PASSWORD@postgres:5432/vertice_github_bot"

# GitHub
GITHUB_WEBHOOK_SECRET="seu-webhook-secret"

# AI APIs
GEMINI_API_KEY="sua-chave-gemini"
ANTHROPIC_API_KEY="sua-chave-anthropic"

# Redis
REDIS_HOST="redis"
REDIS_PORT="6379"

# App
PORT="3000"
NODE_ENV="production"

# Observability
LOG_LEVEL="info"
OTEL_ENABLED="true"
```

### 3. Build da Aplicação

```bash
# Instalar dependências
pnpm install --frozen-lockfile

# Gerar Prisma Client
pnpm prisma generate

# Build
pnpm build

# Verificar
ls -la dist/
```

### 4. Deploy com Docker Compose

```bash
# Criar network
docker network create vertice-bot-network

# Subir serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Verificar containers rodando
docker-compose ps
```

### 5. Verificar Health

```bash
# Health check
curl http://localhost:3000/health

# Metrics
curl http://localhost:3000/metrics

# De fora da VM (seu computador)
curl http://<public-ip>:3000/health
```

---

## Parte 5: Configurar Webhook do GitHub

### 1. Obter URL Pública

```bash
echo "https://<public-ip>:3000/webhook/github"
```

### 2. Configurar no GitHub

1. Ir em: `https://github.com/YOUR_ORG/YOUR_REPO/settings/hooks`
2. Clicar em "Add webhook"
3. Configurar:
   - **Payload URL**: `http://<public-ip>:3000/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Mesmo valor de `GITHUB_WEBHOOK_SECRET` no `.env`
   - **Events**: Escolher eventos (Issues, Pull Requests, Comments, etc.)
4. Salvar

### 3. Testar Webhook

```bash
# Monitorar logs
docker-compose logs -f app

# Criar issue de teste no GitHub e verificar logs
```

---

## Parte 6: Configurar SSL com Nginx (HTTPS)

### 1. Instalar Certbot

```bash
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx nginx
```

### 2. Configurar Nginx como Reverse Proxy

```bash
sudo nano /etc/nginx/conf.d/vertice-bot.conf
```

Adicionar:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;  # Substitua pelo seu domínio

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Obter Certificado SSL

```bash
# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Obter certificado Let's Encrypt
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo systemctl enable certbot-renew.timer
```

---

## Parte 7: Monitoramento e Manutenção

### Scripts Úteis

Criar em `~/scripts/`:

**1. `check-health.sh`**
```bash
#!/bin/bash
curl -f http://localhost:3000/health || echo "Health check failed!"
```

**2. `backup-db.sh`**
```bash
#!/bin/bash
docker exec vertice-github-bot-postgres-1 pg_dump -U vertice vertice_github_bot > ~/backups/db-$(date +%Y%m%d-%H%M%S).sql
```

**3. `update-bot.sh`**
```bash
#!/bin/bash
cd ~/vertice-github-bot
git pull
pnpm install
pnpm build
docker-compose restart app
```

### Configurar Cron Jobs

```bash
crontab -e
```

Adicionar:
```cron
# Health check a cada 5 minutos
*/5 * * * * ~/scripts/check-health.sh >> ~/logs/health.log 2>&1

# Backup diário às 3h
0 3 * * * ~/scripts/backup-db.sh >> ~/logs/backup.log 2>&1

# Limpar logs antigos (>7 dias)
0 4 * * * find ~/logs -type f -mtime +7 -delete
```

---

## Parte 8: Troubleshooting

### Problema: VM não conecta

```bash
# Verificar status da instância
oci compute instance get --instance-id <instance-ocid>

# Verificar VNC console (se SSH falhar)
oci compute instance-console-connection create \
  --instance-id <instance-ocid> \
  --ssh-public-key-file ~/.ssh/oci_vertice_bot.pub
```

### Problema: Sem capacidade ARM

```bash
# Tentar outra AD
oci iam availability-domain list --compartment-id <compartment-ocid>

# Ou usar script de retry automático (criar check-capacity.sh)
while true; do
  oci compute instance launch ... && break
  echo "No capacity, retrying in 5 minutes..."
  sleep 300
done
```

### Problema: Porta 3000 não acessível

```bash
# Verificar firewall OCI (Security List)
# Verificar firewall VM
sudo firewall-cmd --list-all

# Verificar Docker
docker-compose ps
docker-compose logs app
```

---

## Custos e Limites

### Free Tier Permanente

✅ **O que está sempre grátis:**
- 1 VM ARM Ampere (4 OCPU, 24GB RAM)
- 200GB Block Storage
- VCN, Subnets, Route Tables, Security Lists
- Load Balancer (1 instância, 10Mbps)
- Egress: 10TB/mês

⚠️ **O que pode gerar custo:**
- VMs acima do free tier
- Block Storage acima de 200GB
- Backup automático de databases
- Load Balancer acima de 10Mbps

**Dica**: Configure billing alerts em: Console → Billing → Cost Management

---

## Conclusão

Seu Vértice GitHub Bot agora está rodando no Oracle Cloud com:

✅ 24GB RAM (ARM Ampere)
✅ HTTPS com SSL
✅ PostgreSQL + Redis
✅ Monitoramento e backups
✅ **GRÁTIS PARA SEMPRE!**

---

## Comandos Rápidos de Referência

```bash
# Ver logs
docker-compose logs -f

# Restart aplicação
docker-compose restart app

# Atualizar código
cd ~/vertice-github-bot && git pull && pnpm build && docker-compose restart app

# Backup database
docker exec vertice-github-bot-postgres-1 pg_dump -U vertice vertice_github_bot > backup.sql

# Ver métricas
curl http://localhost:3000/metrics
```

---

**🙏 Glory to JESUS for Oracle's generous free tier!**

**Para suporte**: Abrir issue no repositório GitHub
