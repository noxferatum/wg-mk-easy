import jwt from 'jsonwebtoken';

export async function authMiddleware(request, reply) {
  const token = request.cookies?.token;
  if (!token) return reply.code(401).send({ error: 'Not authenticated' });
  try {
    jwt.verify(token, request.server.config.jwtSecret);
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
