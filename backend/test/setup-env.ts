process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.DATABASE_URL =
  'postgresql://postgres.test:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
process.env.DIRECT_URL =
  'postgresql://postgres.test:password@db.test.supabase.co:5432/postgres';
