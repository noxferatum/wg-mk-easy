# wg-mk-easy - Design Spec

**Date:** 2026-03-31
**Status:** Approved
**License:** MIT

## Overview

Web-based WireGuard management UI for MikroTik RouterOS. Like wg-easy, but instead of managing a local WireGuard instance, it connects to a MikroTik router via its REST API to manage WireGuard peers, generate QR codes, and show connection stats.

## Decisions

| Aspect | Decision |
|---|---|
| Name | wg-mk-easy |
| Auth | Single password (env var) + JWT cookie |
| Backend | Node.js + Fastify |
| Frontend | Vue 3 + Pinia + Vue Router + Vue I18n |
| Router communication | RouterOS 7 REST API (HTTP Basic Auth) |
| Real-time state | WebSocket with 5s polling to router |
| Key generation | Node.js (tweetnacl) |
| QR codes | qrcode (npm) |
| Charts | Chart.js |
| Theme | Dark / Light / System |
| Languages | English + Spanish (i18n extensible) |
| Deployment | Docker, single container |
| Database | None — state lives in RouterOS, app config encrypted in JSON |
| Port | 51821 → 3000 |

## Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Container               │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Fastify (Node.js)                   │   │
│  │  ├── /api/auth      → Login/logout   │   │
│  │  ├── /api/peers     → CRUD peers     │   │
│  │  ├── /api/server    → WG server info │   │
│  │  ├── /api/stats     → Traffic/usage  │   │
│  │  ├── /ws            → Real-time      │   │
│  │  └── /*             → Vue SPA        │   │
│  └──────────┬───────────────────────────┘   │
│             │ HTTPS (RouterOS REST API)      │
│             ▼                               │
│  ┌──────────────────────┐                   │
│  │  MikroTik Router     │                   │
│  │  192.168.x.x:443     │                   │
│  └──────────────────────┘                   │
└─────────────────────────────────────────────┘
```

Single Fastify server serves both the API and the Vue SPA as static files. No database — all WireGuard state is read/written directly to RouterOS. Only persisted data is the router connection credentials (encrypted in `/data/config.json`).

## RouterOS REST API Endpoints

| Operation | Method | RouterOS Endpoint |
|---|---|---|
| List peers | GET | `/rest/interface/wireguard/peers` |
| Create peer | PUT | `/rest/interface/wireguard/peers` |
| Edit peer | PATCH | `/rest/interface/wireguard/peers/{id}` |
| Delete peer | DELETE | `/rest/interface/wireguard/peers/{id}` |
| WG interface info | GET | `/rest/interface/wireguard` |
| Interface traffic | GET | `/rest/interface?name=wireguard1` |
| IP addresses | GET | `/rest/ip/address` |

Authentication: HTTP Basic Auth with RouterOS credentials stored encrypted in `/data/config.json`.

## Screens

### Login
- Single password input (password set via `PASSWORD` env var)
- JWT stored in httpOnly cookie

### Dashboard
- Summary cards: total peers, online, offline, total traffic
- Traffic chart (last 24h from RouterOS data)
- Last handshake per peer

### Peers
- List with: name, assigned IP, status (online/offline based on handshake), upload/download traffic
- Create: name → generate keypair → assign IP → create in RouterOS → show QR
- Edit: change name, enable/disable
- Delete: with confirmation
- QR code: full client config rendered as QR
- Download: `.conf` file for WireGuard app import

### Settings
- Theme: dark / light / system
- Language: ES / EN
- Router connection: host, user, password
- WG server config: port, IP range, DNS, endpoint

## Key Generation

Keys generated in Node.js using `tweetnacl` (Curve25519). The app generates both private and public keys for new peers. The private key is included in the client config (QR/.conf) and never stored. Only the public key is sent to RouterOS.

## Real-time Updates

WebSocket connection from frontend to backend. Backend polls RouterOS every 5 seconds for peer status (last handshake, tx/rx bytes) and pushes updates to connected clients.

## Project Structure

```
wg-mk-easy/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── .env.example
├── README.md
├── LICENSE
├── server/
│   ├── index.js
│   ├── config.js
│   ├── auth/
│   │   ├── middleware.js
│   │   └── routes.js
│   ├── mikrotik/
│   │   ├── client.js
│   │   └── polling.js
│   ├── wireguard/
│   │   ├── keys.js
│   │   ├── config.js
│   │   └── qr.js
│   ├── routes/
│   │   ├── peers.js
│   │   ├── server.js
│   │   └── stats.js
│   ├── ws/
│   │   └── index.js
│   └── i18n/
│       ├── es.json
│       └── en.json
├── client/
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router.js
│   │   ├── stores/
│   │   │   ├── auth.js
│   │   │   ├── peers.js
│   │   │   └── theme.js
│   │   ├── composables/
│   │   │   ├── useWebSocket.js
│   │   │   └── useI18n.js
│   │   ├── views/
│   │   │   ├── Login.vue
│   │   │   ├── Dashboard.vue
│   │   │   ├── Peers.vue
│   │   │   └── Settings.vue
│   │   ├── components/
│   │   │   ├── PeerCard.vue
│   │   │   ├── PeerForm.vue
│   │   │   ├── QrModal.vue
│   │   │   ├── StatsChart.vue
│   │   │   ├── ThemeToggle.vue
│   │   │   └── LangToggle.vue
│   │   └── assets/styles/
│   │       ├── variables.css
│   │       ├── dark.css
│   │       └── light.css
│   └── public/
│       └── favicon.svg
└── data/
    └── config.json
```

## Docker

**docker-compose.yml:**
```yaml
services:
  wg-mk-easy:
    build: .
    container_name: wg-mk-easy
    restart: unless-stopped
    ports:
      - "51821:3000"
    volumes:
      - ./data:/data
    environment:
      - PASSWORD=${PASSWORD}
      - ROUTER_HOST=${ROUTER_HOST}
      - ROUTER_USER=${ROUTER_USER}
      - ROUTER_PASS=${ROUTER_PASS}
      - WG_INTERFACE=${WG_INTERFACE:-wireguard1}
      - WG_ENDPOINT=${WG_ENDPOINT}
      - WG_DNS=${WG_DNS:-1.1.1.1}
      - WG_ALLOWED_IPS=${WG_ALLOWED_IPS:-0.0.0.0/0}
      - LANG=${LANG:-en}
      - TZ=${TZ:-Europe/Madrid}
```

**Dockerfile:** Multi-stage build. Stage 1 compiles Vue with Vite. Stage 2 runs Fastify on Node slim image serving compiled static files + API.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PASSWORD` | Yes | - | Admin password for the web UI |
| `ROUTER_HOST` | Yes | - | MikroTik router IP/hostname |
| `ROUTER_USER` | Yes | - | RouterOS username |
| `ROUTER_PASS` | Yes | - | RouterOS password |
| `WG_INTERFACE` | No | `wireguard1` | WireGuard interface name on router |
| `WG_ENDPOINT` | Yes | - | Public endpoint for client configs |
| `WG_DNS` | No | `1.1.1.1` | DNS for client configs |
| `WG_ALLOWED_IPS` | No | `0.0.0.0/0` | AllowedIPs for client configs |
| `LANG` | No | `en` | Default language (en/es) |
| `TZ` | No | `Europe/Madrid` | Timezone |

## Out of Scope

- Multi-user / roles
- Firewall / DNS management on the router
- Multiple router support
- Auto-discovery of routers

These can be added later if the community requests them.

## Dependencies

**Server:** fastify, @fastify/websocket, @fastify/static, @fastify/cookie, jsonwebtoken, node-fetch, tweetnacl, qrcode

**Client:** vue 3, vue-router, pinia, chart.js, vue-chartjs, vue-i18n
