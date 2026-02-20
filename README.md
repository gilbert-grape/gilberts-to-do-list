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

Output is in `dist/`. This is a static site (no server-side code) — serve the `dist/` folder with any web server.

---

## Installation on Raspberry Pi

The app is a static PWA with no backend. You only need a lightweight web server (nginx) on your Pi to serve the built files.

### Prerequisites

- Raspberry Pi with Raspberry Pi OS (Lite or Desktop)
- SSH access or direct terminal
- The Pi is connected to your local network

### Step 1: Update the system

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install nginx

```bash
sudo apt install -y nginx
```

nginx starts automatically and is reachable at `http://<pi-ip-address>`.

### Step 3: Build the app

On your development machine (not the Pi), build the app:

```bash
npm run build
```

### Step 4: Copy the build to the Pi

From your development machine, copy the `dist/` folder to the Pi:

```bash
scp -r dist/* pi@<pi-ip-address>:/var/www/html/
```

Replace `<pi-ip-address>` with your Pi's IP (find it with `hostname -I` on the Pi).

### Step 5: Configure nginx for SPA routing

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

### Step 6: Open the app

Open a browser and navigate to:

```
http://<pi-ip-address>
```

The app works as a PWA — you can add it to your home screen on mobile devices for an app-like experience.

### Updating the app

After building a new version, just copy the files again:

```bash
scp -r dist/* pi@<pi-ip-address>:/var/www/html/
```

No restart needed — nginx serves the new files immediately.

### Optional: Access via hostname

To access the Pi by name instead of IP:

```bash
sudo apt install -y avahi-daemon
```

The app is then reachable at `http://<hostname>.local` (default: `http://raspberrypi.local`).

### Optional: HTTPS with self-signed certificate

For PWA features like "Add to Home Screen" on some browsers, HTTPS may be required:

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
