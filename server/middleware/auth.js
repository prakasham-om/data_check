import createError from 'http-errors';
import { verifyAccess } from '../services/jwt.js';

export const requireAuth = (req, _res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return next(createError(401, 'Missing token'));
  try {
    req.user = verifyAccess(token);
    next();
  } catch {
    next(createError(401, 'Invalid token'));
  }
};