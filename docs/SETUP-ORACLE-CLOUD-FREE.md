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

## Do I Need a Domain?

**No, a domain is NOT required.** You can use Grainix ERP with just the server's public IP address (e.g., `http://129.154.xxx.xxx`). Steps 10-13 above already cover the IP-only setup.

**However, a domain IS recommended** for production use because:
- **SSL/HTTPS** — Free via Let's Encrypt, but requires a domain name. Without SSL, passwords are sent in plain text.
- **Professional URL** — `erp.grainix.com` looks better than `http://129.154.45.67`
- **Easier to remember** — Your team won't need to memorize an IP address
- **WhatsApp/Email sharing** — Domain links look trustworthy, IP links look suspicious

**Cost:** A domain costs Rs. 1,500-2,500/year ($5-10/year). Combined with Oracle Cloud Free Tier, your total annual cost is just the domain.

---

## Domain Setup (Optional but Recommended)

### Step A: Buy a Domain Name

**Cheapest domain registrars:**

| Registrar | Price (`.com`) | Price (`.pk`) | Website |
|---|---|---|---|
| **Namecheap** | $8.88/year | N/A | https://www.namecheap.com |
| **Cloudflare** | $8.57/year (at cost) | N/A | https://www.cloudflare.com/products/registrar |
| **GoDaddy** | $12.99/year | N/A | https://www.godaddy.com |
| **PKNIC** | N/A | Rs. 2,500/year | https://www.pknic.net.pk |
| **Hostinger** | $9.99/year | N/A | https://www.hostinger.com |

**Recommended:** Cloudflare Registrar (cheapest, no markup, free DNS management) or Namecheap (easy to use).

**Suggested domain names for a rice mill:**
- `grainixerp.com`
- `yourcompanyname.com`
- `yourcompanyname.pk` (for Pakistani businesses)
- `erp.yourcompanyname.com` (as a subdomain of your existing domain)

### Step B: Point Domain DNS to Oracle Cloud Server

After buying your domain, you need to add DNS records that point your domain to your Oracle Cloud server's IP address.

#### B.1 — If using Namecheap:

1. Log in to https://www.namecheap.com
2. Go to **Domain List** → click **Manage** next to your domain
3. Click **Advanced DNS** tab
4. Delete any existing A records or CNAME records for `@` and `www`
5. Click **Add New Record** and add:

| Type | Host | Value | TTL |
|---|---|---|---|
| **A Record** | `@` | `129.154.xxx.xxx` (your Oracle IP) | Automatic |
| **A Record** | `www` | `129.154.xxx.xxx` (your Oracle IP) | Automatic |

6. Click the green checkmark to save each record

#### B.2 — If using Cloudflare:

1. Log in to https://dash.cloudflare.com
2. Click your domain → **DNS** → **Records**
3. Click **Add Record** and add:

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| **A** | `@` | `129.154.xxx.xxx` | DNS only (gray cloud) | Auto |
| **A** | `www` | `129.154.xxx.xxx` | DNS only (gray cloud) | Auto |

**Important:** Set proxy to **"DNS only"** (gray cloud icon), NOT "Proxied" (orange cloud). This is needed for Certbot SSL to work.

#### B.3 — If using GoDaddy:

1. Log in to https://www.godaddy.com → **My Products** → **DNS**
2. Click **Manage** next to your domain
3. Under **DNS Records**, edit or add:

| Type | Name | Value | TTL |
|---|---|---|---|
| **A** | `@` | `129.154.xxx.xxx` | 600 |
| **A** | `www` | `129.154.xxx.xxx` | 600 |

4. Click **Save**

#### B.4 — If using a subdomain (e.g., `erp.yourcompany.com`):

If you already have a domain and want to use a subdomain:

1. Go to your domain's DNS settings
2. Add only ONE record:

| Type | Name | Value | TTL |
|---|---|---|---|
| **A** | `erp` | `129.154.xxx.xxx` | 300 |

3. Use `erp.yourcompany.com` everywhere in the setup instead of `yourdomain.com`

### Step C: Verify DNS is Working

Wait 5-30 minutes for DNS propagation, then verify:

```bash
# From your local computer or the Oracle server:
ping yourdomain.com
```

You should see responses from your Oracle Cloud IP address (`129.154.xxx.xxx`). If not, wait longer or check your DNS records.

You can also check at https://www.whatsmydns.net — enter your domain and verify the A record shows your Oracle IP worldwide.

### Step D: Update Server Configuration for Domain

SSH into your Oracle Cloud server and run these commands:

#### D.1 — Update Nginx config:
```bash
sudo nano /etc/nginx/sites-available/grainix-erp
```

Replace the `server_name` line:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

Save (`Ctrl+X` → `Y` → `Enter`), then test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### D.2 — Get free SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts (enter email, agree to terms). Certbot automatically configures HTTPS and redirects HTTP to HTTPS.

Verify auto-renewal works:
```bash
sudo certbot renew --dry-run
```

#### D.3 — Update backend environment:
```bash
nano /var/www/riceflow-erp/apps/backend/.env
```

Change `CORS_ORIGINS`:
```env
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

#### D.4 — Update frontend environment:
```bash
nano /var/www/riceflow-erp/apps/frontend/.env.local
```

Change:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
```

#### D.5 — Rebuild and restart:
```bash
cd /var/www/riceflow-erp/apps/frontend
npm run build
cd ../..
pm2 restart all
```

#### D.6 — Test:
Open `https://yourdomain.com` in your browser. You should see Grainix ERP with a secure padlock icon in the address bar.

---

## Summary: With Domain vs Without Domain

| Feature | Without Domain (IP only) | With Domain + SSL |
|---|---|---|
| **Access URL** | `http://129.154.xxx.xxx` | `https://yourdomain.com` |
| **HTTPS/SSL** | No (passwords sent in plain text) | Yes (encrypted, free via Let's Encrypt) |
| **Annual cost** | $0 | $5-10/year (domain only) |
| **Professional look** | No | Yes |
| **Shareable link** | Ugly IP address | Clean branded URL |
| **SEO/Search** | N/A | Can be indexed |

**Recommendation:** Start with IP-only to test everything works. Buy a domain when you're ready for production use.

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
