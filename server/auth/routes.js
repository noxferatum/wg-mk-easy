import jwt from 'jsonwebtoken';

export async function authRoutes(app) {
  app.post('/api/auth/login', async (request, reply) => {
    const { password } = request.body || {};
    if (password !== app.config.password) return reply.code(401).send({ error: 'Invalid password' });
    const token = jwt.sign({ admin: true }, app.config.jwtSecret, { expiresIn: '7d' });
    reply.setCookie('token', token, { path: '/', httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 });
    return { ok: true };
  });

  app.delete('/api/auth/logout', async (request, reply) => {
    reply.setCookie('token', '', { path: '/', httpOnly: true, maxAge: 0 });
    return { ok: true };
  });

  app.get('/api/auth/check', async (request) => {
    const token = request.cookies?.token;
    if (!token) return { authenticated: false };
    try { jwt.verify(token, app.config.jwtSecret); return { authenticated: true }; }
    catch { return { authenticated: false }; }
  });
}
