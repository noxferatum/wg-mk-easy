import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import { config } from './config.js';
import { MikroTikClient } from './mikrotik/client.js';
import { MockMikroTikClient } from './mikrotik/mock.js';
import { PollingService } from './mikrotik/polling.js';

const DEMO_MODE = process.env.DEMO === 'true' || process.env.DEMO === '1';
import { authRoutes } from './auth/routes.js';
import { authMiddleware } from './auth/middleware.js';
import { peersRoutes } from './routes/peers.js';
import { serverRoutes } from './routes/server.js';
import { statsRoutes } from './routes/stats.js';
import { wsRoutes } from './ws/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

// Plugins
await app.register(fastifyCookie);
await app.register(fastifyWebsocket);

// Decorators
app.decorate('config', config);

const mikrotik = DEMO_MODE
  ? new MockMikroTikClient()
  : new MikroTikClient(config.router.host, config.router.user, config.router.pass);
app.decorate('mikrotik', mikrotik);

if (DEMO_MODE) app.log.info('🎭 DEMO MODE — using mock MikroTik data');

const polling = new PollingService(mikrotik, config.wg.interface);
app.decorate('polling', polling);

// Public routes
await app.register(authRoutes);
app.get('/api/health', async () => ({ status: 'ok' }));

// Protected routes
app.register(async function protectedRoutes(app) {
  app.addHook('preHandler', authMiddleware);
  await app.register(peersRoutes);
  await app.register(serverRoutes);
  await app.register(statsRoutes);
  await app.register(wsRoutes);
});

// Serve Vue SPA (production) — only if dist exists
const clientDist = join(__dirname, '..', 'client', 'dist');
try {
  await app.register(fastifyStatic, { root: clientDist, wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/') || req.url.startsWith('/ws')) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });
} catch {
  // client/dist doesn't exist yet (development)
  app.log.info('No client dist found, serving API only');
}

// Start
try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };
