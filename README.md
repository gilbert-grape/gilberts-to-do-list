# Gilberts To-Do List

A modern to-do list PWA built with React, TypeScript, Vite, and TailwindCSS. Features tags, drag & drop hierarchy, mindmap view, recurring tasks, i18n (EN/DE), and full offline support via IndexedDB.

## Quick Start (Development)

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Scripts

| Command           | Description                     |
|-------------------|---------------------------------|
| `npm run dev`     | Start dev server with HMR       |
| `npm run build`   | Type-check and build for prod   |
| `npm run preview` | Preview production build locally|
| `npm run test`    | Run all tests                   |
| `npm run lint`    | Lint with ESLint                |
| `npm run format`  | Format with Prettier            |

## Production Build

```bash
npm run build
```

Output is in `dist/`. You can serve the `dist/` folder with any web server (static mode), or use the included Node.js server for SQLite-backed storage.

---

## Installation on Raspberry Pi

There are two ways to run the app on a Raspberry Pi:

| | Option A: Static (nginx) | Option B: Docker (with server) |
|---|---|---|
| **Storage** | Browser-only (IndexedDB) | Server-side SQLite database |
| **Multi-device** | No (each browser has its own data) | Yes (all devices share one database) |
| **Requirements** | nginx | Docker |
| **Complexity** | Simpler | Slightly more setup |

### Option A: Static PWA with nginx

The app runs entirely in the browser with data stored in IndexedDB. No server-side code needed.

#### Prerequisites

- Raspberry Pi with Raspberry Pi OS (Lite or Desktop)
- SSH access or direct terminal
- The Pi is connected to your local network

#### Step 1: Update the system

```bash
sudo apt update && sudo apt upgrade -y
```

#### Step 2: Install nginx

```bash
sudo apt install -y nginx
```

nginx starts automatically and is reachable at `http://<pi-ip-address>`.

#### Step 3: Build the app

On your development machine (not the Pi), build the app:

```bash
npm run build
```

#### Step 4: Copy the build to the Pi

From your development machine, copy the `dist/` folder to the Pi:

```bash
scp -r dist/* pi@<pi-ip-address>:/var/www/html/
```

Replace `<pi-ip-address>` with your Pi's IP (find it with `hostname -I` on the Pi).

#### Step 5: Configure nginx for SPA routing

The app uses client-side routing, so nginx needs to serve `index.html` for all routes.

```bash
sudo nano /etc/nginx/sites-available/default
```

Replace the `location /` block with:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|svg|ico|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Restart nginx:

```bash
sudo nginx -t && sudo systemctl restart nginx
```

#### Step 6: Open the app

Open a browser and navigate to:

```
http://<pi-ip-address>
```

The app works as a PWA — you can add it to your home screen on mobile devices for an app-like experience.

#### Updating

After building a new version, just copy the files again:

```bash
scp -r dist/* pi@<pi-ip-address>:/var/www/html/
```

No restart needed — nginx serves the new files immediately.

### Option B: Docker with SQLite server

The app runs inside a Docker container with a Node.js backend and a SQLite database. Data is stored on the Pi's filesystem and shared across all devices.

#### Prerequisites

- Raspberry Pi with Raspberry Pi OS (Lite or Desktop)
- SSH access or direct terminal
- Docker installed on the Pi

#### Step 1: Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect.

#### Step 2: Clone the repository

```bash
git clone https://github.com/gilbert-grape/gilberts-to-do-list.git
cd gilberts-to-do-list
```

#### Step 3: Build and run the container

```bash
docker build -t gilberts-todo .
docker run -d \
  --name gilberts-todo \
  --restart unless-stopped \
  -p 8099:8099 \
  -v gilberts-todo-data:/data \
  gilberts-todo
```

This creates a persistent Docker volume (`gilberts-todo-data`) for the SQLite database.

#### Step 4: Open the app

Open a browser and navigate to:

```
http://<pi-ip-address>:8099
```

#### Updating

Pull the latest changes and rebuild:

```bash
cd gilberts-to-do-list
git pull
docker build -t gilberts-todo .
docker stop gilberts-todo && docker rm gilberts-todo
docker run -d \
  --name gilberts-todo \
  --restart unless-stopped \
  -p 8099:8099 \
  -v gilberts-todo-data:/data \
  gilberts-todo
```

Your data is preserved in the `gilberts-todo-data` volume.

### Optional: Access via hostname

To access the Pi by name instead of IP (works with both options):

```bash
sudo apt install -y avahi-daemon
```

The app is then reachable at `http://raspberrypi.local` (or `http://raspberrypi.local:8099` for Option B).

### Optional: HTTPS with self-signed certificate

For PWA features like "Add to Home Screen" on some browsers, HTTPS may be required.

**Option A (nginx):**

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt \
  -subj "/CN=raspberrypi.local"
```

Update the nginx config to add an HTTPS server block:

```nginx
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    ssl_certificate /etc/ssl/certs/selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/selfsigned.key;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|svg|ico|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo nginx -t && sudo systemctl restart nginx
```

**Option B (Docker):** Place a reverse proxy (e.g. nginx, Caddy, or Traefik) in front of the container to terminate TLS.

---

## Installation in Home Assistant

The app can be installed as a Home Assistant add-on. It runs as a Docker container inside Home Assistant with its own sidebar entry, using Home Assistant's ingress for secure access without exposing extra ports.

### Prerequisites

- Home Assistant OS or Home Assistant Supervised
- Access to the Home Assistant web UI

### Step 1: Add the repository

1. In Home Assistant, go to **Settings** > **Add-ons** > **Add-on Store**
2. Click the **three dots** (top right) > **Repositories**
3. Paste the repository URL:
   ```
   https://github.com/gilbert-grape/gilberts-to-do-list
   ```
4. Click **Add** and then **Close**

### Step 2: Install the add-on

1. The add-on store refreshes automatically. Find **Gilberts To-Do List** in the list (you may need to scroll down or refresh the page)
2. Click on it and then click **Install**
3. Wait for the build to complete — this may take a few minutes on a Raspberry Pi as it compiles the frontend

### Step 3: Start the add-on

1. After installation, click **Start**
2. Enable **Show in sidebar** if you want quick access from the Home Assistant menu

### Step 4: Open the app

Click **Open Web UI** on the add-on page, or click the new sidebar entry. The app opens directly inside Home Assistant via ingress — no separate port or login required.

### Data storage

The SQLite database is stored in the add-on's persistent data directory (`/data/gilberts-todo.db`). Your data survives add-on restarts and updates.

### Updating

When a new version is available:

1. Go to **Settings** > **Add-ons** > **Gilberts To-Do List**
2. Click **Update** (if available) or **Rebuild** to pull the latest code

### Architecture support

The add-on supports the following architectures:

- `aarch64` — Raspberry Pi 4/5, modern ARM boards
- `amd64` — Intel/AMD x86-64 (NUCs, VMs)
- `armv7` — Raspberry Pi 3, older ARM boards
- `i386` — 32-bit x86

---

## Tech Stack

- **React 19** + TypeScript
- **Vite 7** (build + dev server)
- **TailwindCSS 4**
- **Zustand** (state management)
- **Dexie / IndexedDB** (local storage)
- **React Flow** (mindmap view)
- **dnd-kit** (drag & drop)
- **i18next** (EN/DE localization)
- **Vite PWA** (offline support + installable)
- **Vitest** + Testing Library (tests)
