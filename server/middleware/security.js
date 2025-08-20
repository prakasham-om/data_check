import rateLimit from 'express-rate-limit';

export const security = () => {
  const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
  return apiLimiter;
};