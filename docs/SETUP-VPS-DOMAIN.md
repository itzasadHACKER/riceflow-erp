# Grainix ERP — VPS & Domain Deployment Guide

**Powered by Asad Ali | 0308-4420406**

This guide walks you through deploying Grainix ERP on a VPS (Virtual Private Server) with your own domain name, so your entire team can access it from anywhere via `https://yourdomain.com`.

---

## What You Need Before Starting

1. **A VPS** — Any Linux VPS provider works:
   - [DigitalOcean](https://www.digitalocean.com) — $6/month (1 GB RAM) or $12/month (2 GB RAM, recommended)
   - [Hetzner](https://www.hetzner.com) — €4.50/month (excellent value)
   - [AWS Lightsail](https://aws.amazon.com/lightsail/) — $5/month
   - [Vultr](https://www.vultr.com) — $6/month
   - [Linode/Akamai](https://www.linode.com) — $5/month

2. **A Domain Name** — Purchase from:
   - [Namecheap](https://www.namecheap.com) — ~$10/year
   - [GoDaddy](https://www.godaddy.com)
   - [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)
   - Or any domain registrar

3. **SSH Access** — You'll connect to your VPS via SSH (terminal/PuTTY)

---

## Recommended VPS Specifications

| Users | RAM | CPU | Disk | Monthly Cost |
|---|---|---|---|---|
| 1-5 users | 2 GB | 1 vCPU | 50 GB SSD | ~$12/month |
| 5-15 users | 4 GB | 2 vCPU | 80 GB SSD | ~$24/month |
| 15-50 users | 8 GB | 4 vCPU | 160 GB SSD | ~$48/month |
| 50+ users | 16 GB | 8 vCPU | 320 GB SSD | ~$96/month |

Choose **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** as your operating system.

---

## Step 1: Purchase and Set Up Your VPS

### 1.1 Create VPS (DigitalOcean Example)

1. Sign up at https://www.digitalocean.com
2. Click **Create** → **Droplets**
3. Choose:
   - **Region:** Choose closest to your users (e.g., Singapore for Pakistan)
   - **Image:** Ubuntu 22.04 LTS
   - **Size:** Basic → Regular → $12/month (2 GB / 1 CPU / 50 GB SSD)
   - **Authentication:** SSH Key (recommended) or Password
4. Click **Create Droplet**
5. Note your server's **IP address** (e.g., `167.71.123.456`)

### 1.2 Connect to Your VPS

**Windows:** Use [PuTTY](https://www.putty.org) or Windows Terminal:
```bash
ssh root@167.71.123.456
```

**Mac/Linux:**
```bash
ssh root@167.71.123.456
```

You'll be asked to confirm the connection (type `yes`) and enter your password.

---

## Step 2: Point Your Domain to the VPS

### 2.1 Add DNS Records

Go to your domain registrar's DNS settings and add:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `167.71.123.456` | 300 |
| A | www | `167.71.123.456` | 300 |

Replace `167.71.123.456` with your actual VPS IP address.

**Wait 5-30 minutes** for DNS to propagate. You can check with:
```bash
ping yourdomain.com
```

---

## Step 3: Install Required Software on VPS

Run these commands on your VPS (logged in as root):

### 3.1 Update System
```bash
apt update && apt upgrade -y
```

### 3.2 Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
```

### 3.3 Install PostgreSQL 16
```bash
apt install -y postgresql-16 postgresql-client-16
systemctl start postgresql
systemctl enable postgresql
```

### 3.4 Install Nginx (Web Server / Reverse Proxy)
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 3.5 Install Git
```bash
apt install -y git
```

### 3.6 Install PM2 (Process Manager — Keeps App Running)
```bash
npm install -g pm2
```

### 3.7 Install Certbot (Free SSL Certificates)
```bash
apt install -y certbot python3-certbot-nginx
```

---

## Step 4: Create Database

```bash
# Switch to PostgreSQL user
sudo -u postgres psql

# Inside psql, run:
CREATE DATABASE grainix_erp;
CREATE USER grainix WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE grainix_erp TO grainix;
ALTER DATABASE grainix_erp OWNER TO grainix;

# Exit psql
\q
```

**IMPORTANT:** Replace `your_strong_password_here` with a strong password (20+ characters, mix of letters, numbers, symbols). Save this password — you'll need it in Step 5.

---

## Step 5: Download and Configure the Software

### 5.1 Clone the Repository
```bash
# Create application directory
mkdir -p /var/www
cd /var/www

# Clone the code
git clone https://github.com/itzasadHACKER/riceflow-erp.git
cd riceflow-erp
```

### 5.2 Configure Backend Environment
```bash
cd apps/backend
cp .env.example .env
nano .env
```

Update the `.env` file with these values:

```env
# Database — use the password you set in Step 4
DATABASE_URL="postgresql://grainix:your_strong_password_here@localhost:5432/grainix_erp"

# Authentication — generate a strong random secret
JWT_SECRET="generate-a-64-character-random-string-here-use-openssl-rand"

# Server
PORT=3001
NODE_ENV=production

# CORS — replace with your actual domain
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

**Generate a secure JWT_SECRET:**
```bash
openssl rand -base64 48
```
Copy the output and paste it as your JWT_SECRET value.

Save the file: `Ctrl+X`, then `Y`, then `Enter`.

### 5.3 Configure Frontend Environment
```bash
cd ../frontend
```

Create a `.env.local` file:
```bash
nano .env.local
```

Add:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 6: Install Dependencies and Build

```bash
# Go to project root
cd /var/www/riceflow-erp

# Install root dependencies
npm install

# Install and build backend
cd apps/backend
npm install
npx prisma generate
npx prisma db push
npm run build

# Install and build frontend
cd ../frontend
npm install
npm run build

# Go back to root
cd ../..
```

---

## Step 7: Configure Nginx (Web Server)

### 7.1 Create Nginx Configuration
```bash
nano /etc/nginx/sites-available/grainix-erp
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (Next.js)
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

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase upload size for CSV imports
        client_max_body_size 50M;
    }
}
```

Save: `Ctrl+X` → `Y` → `Enter`

### 7.2 Enable the Site
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/grainix-erp /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

---

## Step 8: Install SSL Certificate (HTTPS)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
1. Enter your email address
2. Agree to terms of service (Y)
3. Choose whether to share email with EFF (optional)
4. Certbot will automatically configure Nginx for HTTPS

**SSL auto-renewal** is set up automatically. Verify with:
```bash
certbot renew --dry-run
```

---

## Step 9: Start the Application with PM2

```bash
cd /var/www/riceflow-erp

# Start backend
pm2 start apps/backend/dist/main.js --name "grainix-backend" --env production

# Start frontend
pm2 start npm --name "grainix-frontend" -- run start --prefix apps/frontend

# Save PM2 process list (auto-restart on reboot)
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

**Verify both are running:**
```bash
pm2 status
```

You should see:
```
┌─────────────────┬────┬─────────┬──────────┐
│ Name            │ id │ status  │ restarts │
├─────────────────┼────┼─────────┼──────────┤
│ grainix-backend │ 0  │ online  │ 0        │
│ grainix-frontend│ 1  │ online  │ 0        │
└─────────────────┴────┴─────────┴──────────┘
```

---

## Step 10: Access Your ERP

Open your browser and go to:

**https://yourdomain.com**

1. You'll see the Grainix ERP registration page
2. Register your first organization
3. Select your default currency
4. Start using the software!

---

## Step 11: Set Up Automated Backups

### 11.1 Configure Backup Script
```bash
# Make backup script executable
chmod +x /var/www/riceflow-erp/scripts/backup.sh

# Edit the script to update database credentials
nano /var/www/riceflow-erp/scripts/backup.sh
```

Update `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in the script.

### 11.2 Set Up Automatic Backups with Cron
```bash
crontab -e
```

Add these lines:
```cron
# Daily backup at 2 AM
0 2 * * * /var/www/riceflow-erp/scripts/backup.sh daily >> /var/log/grainix-backup.log 2>&1

# Weekly backup at 3 AM on Sundays
0 3 * * 0 /var/www/riceflow-erp/scripts/backup.sh weekly >> /var/log/grainix-backup.log 2>&1

# Monthly backup at 4 AM on 1st of each month
0 4 1 * * /var/www/riceflow-erp/scripts/backup.sh monthly >> /var/log/grainix-backup.log 2>&1
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 12: Set Up Firewall

```bash
# Allow SSH
ufw allow 22

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Updating the Software

When a new version is available:

```bash
cd /var/www/riceflow-erp

# Pull latest code
git pull

# Install new dependencies
cd apps/backend && npm install && npm run build
cd ../frontend && npm install && npm run build
cd ../..

# Apply database changes
cd apps/backend && npx prisma db push
cd ../..

# Restart services
pm2 restart all
```

---

## Monitoring and Logs

```bash
# View application logs
pm2 logs

# View backend logs only
pm2 logs grainix-backend

# View frontend logs only
pm2 logs grainix-frontend

# Monitor resources
pm2 monit

# View Nginx access logs
tail -f /var/log/nginx/access.log

# View Nginx error logs
tail -f /var/log/nginx/error.log
```

---

## Adding Multiple Companies / Rice Mills

Grainix ERP is **multi-tenant** — each company registers separately and only sees their own data:

1. Company A registers at `https://yourdomain.com/register` → gets their own organization
2. Company B registers at `https://yourdomain.com/register` → gets their own organization
3. Each company's data is completely isolated by `organizationId`
4. As the server owner, you can manage all organizations via the database

---

## Security Checklist

- [ ] Strong PostgreSQL password (20+ characters)
- [ ] Strong JWT_SECRET (use `openssl rand -base64 48`)
- [ ] SSL certificate installed (HTTPS enabled)
- [ ] Firewall enabled (only ports 22, 80, 443 open)
- [ ] Regular backups configured
- [ ] PostgreSQL not accessible from outside (default: localhost only)
- [ ] Keep system updated: `apt update && apt upgrade -y` monthly

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Site not loading | Check PM2: `pm2 status`. Restart: `pm2 restart all` |
| 502 Bad Gateway | Backend crashed. Check: `pm2 logs grainix-backend` |
| SSL certificate error | Run `certbot renew` and `systemctl reload nginx` |
| Database connection error | Check PostgreSQL: `systemctl status postgresql` |
| Domain not resolving | Wait for DNS propagation (up to 48 hours). Check with `ping yourdomain.com` |
| "Permission denied" | Make sure you're running as root or use `sudo` |
| Out of memory | Upgrade VPS or add swap: `fallocate -l 2G /swapfile && mkswap /swapfile && swapon /swapfile` |
| Slow performance | Add swap memory. Consider upgrading VPS plan |

---

## Cost Summary

| Item | Monthly Cost | Annual Cost |
|---|---|---|
| VPS (2 GB RAM) | $12 | $144 |
| Domain Name | — | $10-15 |
| SSL Certificate | Free (Certbot) | Free |
| **Total** | **~$12/month** | **~$155/year** |

---

**Need help with deployment?** Contact Asad Ali — 0308-4420406
