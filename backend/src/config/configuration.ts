import { registerAs } from '@nestjs/config';

export const DEFAULT_BACKEND_PORT = 3000;
export const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? DEFAULT_BACKEND_PORT),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN,
  database: {
    url: process.env.DATABASE_URL ?? '',
    directUrl: process.env.DIRECT_URL ?? '',
  },
}));
