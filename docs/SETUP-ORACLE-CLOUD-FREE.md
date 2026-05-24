# Grainix ERP — Oracle Cloud Free Tier Deployment Guide

**Powered by Asad Ali | 0308-4420406**

Deploy Grainix ERP on Oracle Cloud's **Always Free** tier — a powerful server with 4 CPU cores, 24 GB RAM, and 200 GB storage, completely **free forever** (no credit card charges, no trial expiration).

---

## What You Get for Free (Forever)

| Resource | Free Tier Allocation |
|---|---|
| **Compute** | 4 ARM CPU cores (Ampere A1) |
| **RAM** | 24 GB |
| **Storage** | 200 GB block volume |
| **Data Transfer** | 10 TB/month outbound |
| **Public IP** | 1 static public IP address |
| **OS** | Ubuntu 22.04 or Oracle Linux |

This is more powerful than most $48/month VPS plans. It can easily handle 50+ users and 1000+ invoices/day.

---

## What You Need Before Starting

1. **An Oracle Cloud account** — Free to create (credit card required for verification only, you will NOT be charged)
2. **A domain name** (optional but recommended) — ~$10/year from Namecheap, GoDaddy, or Cloudflare
3. **A computer with SSH** — To connect to your server (Windows Terminal, PuTTY, or Mac/Linux Terminal)

---

## Step 1: Create Oracle Cloud Account

1. Go to **https://cloud.oracle.com/free**
2. Click **"Start for Free"**
3. Fill in your details:
   - Name, email, country
   - Select your **Home Region** (choose closest to your users):
     - For Pakistan/India: **Mumbai** or **Hyderabad**
     - For Middle East: **Jeddah** or **Dubai**
     - For Europe: **Frankfurt** or **London**
   - **IMPORTANT:** Your home region cannot be changed later. Choose wisely.
4. Verify your email
5. Add a credit card (for verification only — Oracle will charge $1 and refund it. Free tier services are genuinely free forever)
6. Complete registration

**Note:** Sometimes Oracle Cloud Free Tier availability is limited in popular regions. If your preferred region shows "capacity unavailable," try again in a few hours or select a different region.

---

## Step 2: Create a Free Compute Instance (Virtual Machine)

### 2.1 Navigate to Compute

1. Log in to https://cloud.oracle.com
2. Click the hamburger menu (☰) → **Compute** → **Instances**
3. Click **"Create Instance"**

### 2.2 Configure Your Instance

**Name:** `grainix-erp`

**Placement:** Leave as default (your home region)

**Image and Shape:**
1. Click **"Edit"** next to Image and Shape
2. **Image:** Click **"Change Image"** → Select **"Ubuntu"** → Choose **"Canonical Ubuntu 22.04"** → Click **"Select Image"**
3. **Shape:** Click **"Change Shape"**
   - Select **"Ampere"** (ARM-based processor)
   - Shape: **VM.Standard.A1.Flex**
   - **OCPUs:** 4 (slide to 4)
   - **Memory:** 24 GB (slide to 24)
   - Click **"Select Shape"**

**Networking:**
- Leave default VCN and subnet (or create new ones)
- Make sure **"Assign a public IPv4 address"** is selected

**SSH Key:**
- Select **"Generate a key pair"**
- Click **"Save Private Key"** — **SAVE THIS FILE! You cannot download it again!**
- Also click **"Save Public Key"** as backup
- The private key file will be named something like `ssh-key-2025-05-23.key`

**Boot Volume:**
- Check **"Specify a custom boot volume size"**
- Set to **200 GB** (maximum free tier)
- Leave **"Use in-transit encryption"** checked

### 2.3 Create the Instance

1. Click **"Create"**
2. Wait 2-5 minutes for the instance to be **Running**
3. Note the **Public IP Address** shown (e.g., `129.154.xxx.xxx`)

---

## Step 3: Open Firewall Ports (Oracle Cloud Console)

Oracle Cloud has its own firewall (Security Lists) in addition to the OS firewall. You must open ports in BOTH.

### 3.1 Open Ports in Oracle Cloud Security List

1. Go to **Networking** → **Virtual Cloud Networks**
2. Click your VCN (e.g., `vcn-20250523-xxxx`)
3. Click your **Public Subnet** (e.g., `subnet-20250523-xxxx`)
4. Click your **Security List** (e.g., `Default Security List for vcn-...`)
5. Click **"Add Ingress Rules"**

Add these rules one by one:

**Rule 1 — HTTP (port 80):**
| Field | Value |
|---|---|
| Source CIDR | `0.0.0.0/0` |
| IP Protocol | TCP |
| Destination Port Range | `80` |

**Rule 2 — HTTPS (port 443):**
| Field | Value |
|---|---|
| Source CIDR | `0.0.0.0/0` |
| IP Protocol | TCP |
| Destination Port Range | `443` |

Click **"Add Ingress Rules"** after each one.

---

## Step 4: Connect to Your Server via SSH

### 4.1 Set File Permissions (Mac/Linux)

```bash
# Move the key file to a safe location
mv ~/Downloads/ssh-key-2025-05-23.key ~/.ssh/oracle-grainix.key

# Set correct permissions
chmod 400 ~/.ssh/oracle-grainix.key
```

### 4.2 Connect

```bash
ssh -i ~/.ssh/oracle-grainix.key ubuntu@129.154.xxx.xxx
```

Replace `129.154.xxx.xxx` with your actual public IP.

### 4.3 Windows Users (PuTTY)

1. Download [PuTTY](https://www.putty.org) and [PuTTYgen](https://www.puttygen.com)
2. Open **PuTTYgen** → Click **"Load"** → Select your `.key` file → Click **"Save private key"** (saves as `.ppk`)
3. Open **PuTTY**:
   - Host: `129.154.xxx.xxx`
   - Port: `22`
   - Connection → SSH → Auth → Browse → Select your `.ppk` file
   - Click **"Open"**
4. Login as: `ubuntu`

### 4.4 Windows Users (Windows Terminal — Easier)

```bash
ssh -i C:\Users\YourName\Downloads\ssh-key-2025-05-23.key ubuntu@129.154.xxx.xxx
```

---

## Step 5: Open OS-Level Firewall Ports

Oracle's Ubuntu image uses `iptables` by default. You need to open ports:

```bash
# Allow HTTP
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT

# Allow HTTPS
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Save rules so they persist after reboot
sudo netfilter-persistent save
```

---

## Step 6: Install Required Software

### 6.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 6.2 Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version    # Should show v20.x.x
npm --version     # Should show 10.x.x
```

### 6.3 Install PostgreSQL 16
```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install
sudo apt install -y postgresql-16 postgresql-client-16

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 6.4 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6.5 Install PM2, Git, and Certbot
```bash
sudo npm install -g pm2
sudo apt install -y git certbot python3-certbot-nginx
```

---

## Step 7: Create Database

```bash
sudo -u postgres psql
```

Inside PostgreSQL:
```sql
CREATE DATABASE grainix_erp;
CREATE USER grainix WITH PASSWORD 'YourStrongPassword123!@#';
GRANT ALL PRIVILEGES ON DATABASE grainix_erp TO grainix;
ALTER DATABASE grainix_erp OWNER TO grainix;
\q
```

**Replace `YourStrongPassword123!@#` with your own strong password. Save it!**

---

## Step 8: Download and Configure Grainix ERP

### 8.1 Clone the Repository
```bash
sudo mkdir -p /var/www
sudo chown ubuntu:ubuntu /var/www
cd /var/www

git clone https://github.com/itzasadHACKER/riceflow-erp.git
cd riceflow-erp
```

### 8.2 Configure Backend
```bash
cd apps/backend
cp .env.example .env
nano .env
```

Set these values:
```env
DATABASE_URL="postgresql://grainix:YourStrongPassword123!@#@localhost:5432/grainix_erp"
JWT_SECRET="paste-output-of-openssl-command-below"
PORT=3001
NODE_ENV=production
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

Generate JWT_SECRET:
```bash
openssl rand -base64 48
```

Save: `Ctrl+X` → `Y` → `Enter`

**If you don't have a domain yet**, use your server IP temporarily:
```env
CORS_ORIGINS="http://129.154.xxx.xxx"
```

### 8.3 Configure Frontend
```bash
cd ../frontend
nano .env.local
```

Add:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
```

Or if using IP temporarily:
```env
NEXT_PUBLIC_API_URL=http://129.154.xxx.xxx/api/v1
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 9: Install Dependencies and Build

```bash
cd /var/www/riceflow-erp

# Install dependencies
npm install
cd apps/backend && npm install
cd ../frontend && npm install
cd ../..

# Set up database
cd apps/backend
npx prisma generate
npx prisma db push

# Build backend
npm run build

# Build frontend
cd ../frontend
npm run build

cd ../..
```

**Note:** The build process may take 5-10 minutes on first run. The ARM processor handles this well with 24 GB RAM.

---

## Step 10: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/grainix-erp
```

**If you have a domain name**, paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
        client_max_body_size 50M;
    }
}
```

**If you DON'T have a domain** (using IP only), paste:
```nginx
server {
    listen 80;
    server_name 129.154.xxx.xxx;

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
        client_max_body_size 50M;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/grainix-erp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 11: Install SSL Certificate (If You Have a Domain)

First, point your domain's DNS A record to your Oracle Cloud IP address (`129.154.xxx.xxx`). Wait for DNS propagation (5-30 minutes).

Then:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts (enter email, agree to terms). Certbot auto-configures HTTPS.

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 12: Start the Application

```bash
cd /var/www/riceflow-erp

# Start backend
pm2 start apps/backend/dist/main.js --name "grainix-backend" --env production

# Start frontend
pm2 start npm --name "grainix-frontend" -- run start --prefix apps/frontend

# Save process list & set up auto-start on reboot
pm2 save
pm2 startup
```

**IMPORTANT:** PM2 startup will print a command like:
```
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```
**Copy and run that exact command** — this ensures PM2 starts automatically if the server reboots.

Verify:
```bash
pm2 status
```

You should see both processes as `online`.

---

## Step 13: Access Your ERP!

Open your browser:
- **With domain:** `https://yourdomain.com`
- **Without domain:** `http://129.154.xxx.xxx`

1. Register your organization
2. Select your default currency (PKR, USD, etc.)
3. Start using Grainix ERP!

---

## Step 14: Set Up Automated Backups

```bash
# Make backup script executable
chmod +x /var/www/riceflow-erp/scripts/backup.sh

# Edit backup script with your database credentials
nano /var/www/riceflow-erp/scripts/backup.sh
```

Update `DB_NAME`, `DB_USER`, `DB_PASSWORD` values, then save.

Set up automatic backups:
```bash
crontab -e
```

Add:
```cron
# Daily backup at 2 AM
0 2 * * * /var/www/riceflow-erp/scripts/backup.sh daily >> /var/log/grainix-backup.log 2>&1

# Weekly backup on Sundays at 3 AM
0 3 * * 0 /var/www/riceflow-erp/scripts/backup.sh weekly >> /var/log/grainix-backup.log 2>&1

# Monthly backup on 1st at 4 AM
0 4 1 * * /var/www/riceflow-erp/scripts/backup.sh monthly >> /var/log/grainix-backup.log 2>&1
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## Monitoring and Maintenance

### View Logs
```bash
pm2 logs                        # All logs
pm2 logs grainix-backend        # Backend only
pm2 logs grainix-frontend       # Frontend only
pm2 monit                       # Live resource monitor
```

### Restart Services
```bash
pm2 restart all                 # Restart everything
pm2 restart grainix-backend     # Restart backend only
```

### Update the Software
```bash
cd /var/www/riceflow-erp
git pull
cd apps/backend && npm install && npx prisma db push && npm run build
cd ../frontend && npm install && npm run build
cd ../..
pm2 restart all
```

### Check Server Resources
```bash
free -h          # Memory usage
df -h            # Disk usage
htop             # CPU and process monitor (install: sudo apt install htop)
```

---

## Oracle Cloud Free Tier — Important Notes

### What stays free forever:
- 4 ARM OCPUs (Ampere A1)
- 24 GB RAM
- 200 GB boot volume storage
- 10 TB/month outbound data transfer
- Public IP address

### What is NOT included in free tier:
- AMD/Intel x86 instances (only ARM is free at this capacity)
- Object Storage beyond 20 GB
- Additional block volumes beyond 200 GB total
- Load Balancers (beyond 1 flexible LB)

### Avoid accidental charges:
1. **Never** click "Upgrade to Paid" unless you intend to
2. Stick to **Always Free** eligible shapes only
3. Check the **Always Free** label when creating resources
4. Monitor usage at **Governance** → **Limits, Quotas, and Usage**

### If your instance gets reclaimed:
Oracle may reclaim **idle** Always Free instances (very rare). To prevent this:
- Keep your ERP running (PM2 ensures this)
- The instance should have regular traffic/activity
- If reclaimed, you can create a new one and restore from backup

---

## Connecting Your Domain to Oracle Cloud

If you buy a domain later, here's how to connect it:

### At your domain registrar (Namecheap, GoDaddy, etc.):
Add DNS records:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `129.154.xxx.xxx` | 300 |
| A | www | `129.154.xxx.xxx` | 300 |

### On your server:
1. Update Nginx config with your domain name
2. Update `CORS_ORIGINS` in backend `.env`
3. Update `NEXT_PUBLIC_API_URL` in frontend `.env.local`
4. Run `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
5. Rebuild frontend: `cd apps/frontend && npm run build`
6. Restart: `pm2 restart all`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Can't create instance (capacity) | Try again in a few hours. ARM instances are popular. Try different availability domain |
| SSH connection refused | Check Security List ingress rules for port 22. Verify your key file |
| Site not loading after setup | Check `pm2 status`. Check `sudo nginx -t`. Check iptables rules |
| 502 Bad Gateway | Backend crashed. Run `pm2 logs grainix-backend` to see the error |
| SSL certificate fails | Make sure DNS is pointing to your IP. Wait for propagation. Run `ping yourdomain.com` |
| Out of disk space | Check with `df -h`. Clean old backups or logs |
| Instance stopped/reclaimed | Create a new instance and restore from backup. Keep the app active |
| Slow SSH connection | Normal for Oracle Cloud. Add `ServerAliveInterval 60` to SSH config |
| Build fails (out of memory) | Shouldn't happen with 24 GB RAM. Check `free -h` |
| Database connection error | Check PostgreSQL: `sudo systemctl status postgresql` |

---

## Cost Comparison

| Provider | Specs | Monthly Cost | Annual Cost |
|---|---|---|---|
| **Oracle Cloud Free** | **4 CPU, 24 GB RAM, 200 GB** | **$0** | **$0** |
| DigitalOcean | 2 CPU, 4 GB RAM, 80 GB | $24 | $288 |
| Hetzner | 2 CPU, 4 GB RAM, 40 GB | €5.50 | €66 |
| AWS Lightsail | 2 CPU, 4 GB RAM, 80 GB | $24 | $288 |
| Hostinger VPS | 2 CPU, 2 GB RAM, 40 GB | $5 | $60 |

Oracle Cloud's free tier gives you **4x more RAM** and **2x more CPU** than most $24/month plans — for $0.

---

**Need help with deployment?** Contact Asad Ali — 0308-4420406
