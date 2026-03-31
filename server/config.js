import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  password: process.env.PASSWORD || 'changeme',
  jwtSecret: process.env.JWT_SECRET || process.env.PASSWORD || 'changeme',
  router: {
    host: process.env.ROUTER_HOST || '192.168.88.1',
    user: process.env.ROUTER_USER || 'admin',
    pass: process.env.ROUTER_PASS || '',
  },
  wg: {
    interface: process.env.WG_INTERFACE || 'wireguard1',
    endpoint: process.env.WG_ENDPOINT || 'vpn.example.com:51820',
    dns: process.env.WG_DNS || '1.1.1.1',
    allowedIps: process.env.WG_ALLOWED_IPS || '0.0.0.0/0',
  },
  lang: process.env.LANG || 'en',
  tz: process.env.TZ || 'Europe/Madrid',
  dataDir: process.env.DATA_DIR || './data',
};
