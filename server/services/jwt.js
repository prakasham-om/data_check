import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const issueAccess = (payload) => jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
export const issueRefresh = (payload) => jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
export const verifyAccess = (t) => jwt.verify(t, env.JWT_ACCESS_SECRET);
export const verifyRefresh = (t) => jwt.verify(t, env.JWT_REFRESH_SECRET);
