# Deploy the 7router API to the VPS (pnpm + pm2 + nginx + Cloudflare Origin TLS)

Same approach as 6Gate: a GitHub runner SSHes into the VPS and runs
[remote-deploy.sh](remote-deploy.sh) (`git pull -> pnpm install -> prisma migrate
deploy -> build -> pm2 reload`). No Docker. The API sits behind nginx with a
Cloudflare Origin Certificate (no certbot); the UI is deployed separately (Vercel).

> Replace placeholders: `<REPO_URL>`, `<VPS_IP>`.

---

## 0. Cloudflare DNS (one-time)
- A record: `7router-api` → `<VPS_IP>`, **Proxied** (orange cloud).
- SSL/TLS → mode **Full (strict)**.
- The shared `*.minfect.com` Origin cert already on the box covers
  `7router-api.minfect.com` — reuse `/etc/nginx/ssl/minfect.com.{pem,key}`.

## 1. Get the code
```bash
cd ~ && git clone <REPO_URL> 7router
```

## 2. Node + pnpm + pm2 (skip what's installed)
```bash
node -v || curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
corepack enable pnpm
sudo npm i -g pm2
```

## 3. Secrets — create app/.env (bootstrap settings only)
```bash
cat > ~/7router/app/.env <<'EOF'
SYSTEM_SECRET=<your-login-secret>
ENCRYPTION_KEY=<your-encryption-key>
DATABASE_URL=postgresql://minfect:<db-password>@postgres.minfect.com:5432/sevenrouter
EOF
chmod 600 ~/7router/app/.env
```
> - `SYSTEM_SECRET` is the admin login credential.
> - `ENCRYPTION_KEY` **must equal the value used when credentials were encrypted**,
>   or stored provider credentials and access tokens won't decrypt. Don't rotate it.

## 4. Build + start with pm2
```bash
cd ~/7router
pnpm install --frozen-lockfile --filter @7router/app...
pnpm --filter @7router/app exec prisma generate
pnpm --filter @7router/app exec prisma migrate deploy
pnpm --filter @7router/app build
cd app
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # run the command it prints (enables boot persistence)
```
Smoke-test locally (the API listens on 127.0.0.1:20131):
```bash
pm2 logs 7router-api --lines 30
SECRET=$(grep SYSTEM_SECRET ~/7router/app/.env | cut -d= -f2)
curl -s -H "Authorization: Bearer $SECRET" http://127.0.0.1:20131/providers | head -c 200; echo
```

## 5. nginx site
```bash
sudo cp ~/7router/deploy/nginx/7router-api.minfect.com.conf \
        /etc/nginx/sites-available/7router-api.minfect.com
sudo ln -sf /etc/nginx/sites-available/7router-api.minfect.com \
            /etc/nginx/sites-enabled/7router-api.minfect.com
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Firewall (expose only 80/443; keep 20131 private)
```bash
sudo ufw allow 'Nginx Full' 2>/dev/null || true
sudo ufw deny 20131 2>/dev/null || true
```

## 7. Verify end-to-end (through Cloudflare)
```bash
SECRET=$(grep SYSTEM_SECRET ~/7router/app/.env | cut -d= -f2)
curl -s https://7router-api.minfect.com/providers -H "Authorization: Bearer $SECRET" | head -c 200; echo
```
Expect a JSON array of providers.

---

## Continuous deploy (GitHub Actions → SSH, password auth)
On every push to `main` touching `app/**`, a GitHub-hosted runner SSHes into the VPS
(`sshpass` password auth) and runs [remote-deploy.sh](remote-deploy.sh). See
[.github/workflows/deploy-api.yml](../.github/workflows/deploy-api.yml). `app/.env`
is gitignored, so the pull never touches it.

**One-time setup:**

1. VPS allows password SSH for this user — in `/etc/ssh/sshd_config`:
   ```
   PasswordAuthentication yes
   PermitRootLogin yes        # only if deploying as root
   ```
   then `sudo systemctl restart ssh`.
2. GitHub → repo **Settings → Secrets and variables → Actions**:
   | Secret | Value |
   |--------|-------|
   | `VPS_HOST` | VPS IP |
   | `VPS_USER` | `root` (or a deploy user) |
   | `VPS_PASSWORD` | the SSH password |
   | `VPS_PORT` | optional, if SSH isn't on 22 |
3. The repo must already be cloned at `~/7router` on the VPS (step 1) with
   `app/.env` in place (step 3).

**Test it:** push any change under `app/` → **Actions** tab → "Deploy API (SSH)" runs
and the API reloads.

> Security: password + root is the weakest option. Prefer an SSH key and/or a
> non-root deploy user when you can.

## UI
Not covered by this workflow (same as 6Gate). Deploy the Vite UI to Vercel, or
build `ui/dist` on the VPS and serve it from nginx as a static site. The UI calls
the API at `https://7router-api.minfect.com` — set `VITE_7ROUTER_API_BASE_URL`
accordingly at build time.

## Notes
- **1 pm2 instance only** (`ecosystem.config.js`).
- **Cloudflare upload cap**: 100 MB per request on Free/Pro.
