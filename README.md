# wg-mk-easy

Web-based WireGuard management UI for MikroTik RouterOS. Like [wg-easy](https://github.com/wg-easy/wg-easy), but for MikroTik routers.

Manage WireGuard peers, generate QR codes, monitor connections — all through a clean web interface that talks to your MikroTik router via its REST API.

## Features

- **Peer Management** — Create, edit, enable/disable, and delete WireGuard peers
- **QR Codes** — Generate scannable QR codes for easy mobile setup
- **Config Download** — Download `.conf` files for any WireGuard client
- **Real-time Status** — Live peer connection status via WebSocket
- **Dashboard** — Overview with traffic stats and charts
- **Dark/Light Theme** — Dark mode by default, with light and system options
- **Multi-language** — English and Spanish (extensible via i18n)
- **Single Container** — One Docker image, minimal setup

## Requirements

- MikroTik router running **RouterOS 7+** with REST API enabled
- WireGuard interface configured on the router
- Docker and Docker Compose

## Quick Start

```bash
# Clone the repo
git clone https://github.com/noxferatum/wg-mk-easy.git
cd wg-mk-easy

# Configure
cp .env.example .env
# Edit .env with your router details

# Run
docker compose up -d
```

Open `http://localhost:51821` and sign in with the password from your `.env`.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PASSWORD` | Yes | — | Admin password for the web UI |
| `ROUTER_HOST` | Yes | — | MikroTik router IP or hostname |
| `ROUTER_USER` | Yes | — | RouterOS username |
| `ROUTER_PASS` | Yes | — | RouterOS password |
| `WG_INTERFACE` | No | `wireguard1` | WireGuard interface name on router |
| `WG_ENDPOINT` | Yes | — | Public endpoint for client configs (e.g. `vpn.example.com:51820`) |
| `WG_DNS` | No | `1.1.1.1` | DNS server for client configs |
| `WG_ALLOWED_IPS` | No | `0.0.0.0/0` | AllowedIPs for client configs |
| `LANG` | No | `en` | Default language (`en` or `es`) |
| `TZ` | No | `Europe/Madrid` | Timezone |

## MikroTik Setup

1. Enable the REST API on your router:
   ```
   /ip/service/set www-ssl disabled=no
   ```

2. Create a WireGuard interface (if not already):
   ```
   /interface/wireguard/add name=wireguard1 listen-port=51820
   ```

3. Add an IP address to the interface:
   ```
   /ip/address/add address=10.0.0.1/24 interface=wireguard1
   ```

4. Add firewall and NAT rules:
   ```
   /ip/firewall/filter/add chain=input protocol=udp dst-port=51820 action=accept
   /ip/firewall/nat/add chain=srcnat src-address=10.0.0.0/24 action=masquerade
   ```

## Development

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Start backend (port 3000)
npm run dev

# Start frontend (port 5173, proxies API to 3000)
cd client && npm run dev
```

## Tech Stack

- **Backend:** Node.js, Fastify, WebSocket
- **Frontend:** Vue 3, Pinia, Vue Router, Vue I18n, Chart.js
- **Build:** Vite, Docker multi-stage
- **Router API:** MikroTik RouterOS 7 REST API

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)
