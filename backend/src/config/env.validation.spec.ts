import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('accepts a complete Supabase database configuration', () => {
    const env = validateEnv({
      NODE_ENV: 'development',
      PORT: '3001',
      DATABASE_URL:
        'postgresql://postgres.abcd:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
      DIRECT_URL:
        'postgresql://postgres.abcd:password@db.abcd.supabase.co:5432/postgres',
    });

    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
  });

  it('fails loudly when the pooled database URL is missing', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        DIRECT_URL:
          'postgresql://postgres.abcd:password@db.abcd.supabase.co:5432/postgres',
      }),
    ).toThrow('Environment validation failed');
  });
});
