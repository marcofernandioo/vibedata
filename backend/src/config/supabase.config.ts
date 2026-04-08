import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_ADMIN_CLIENT = Symbol('SUPABASE_ADMIN_CLIENT');

export function createSupabaseAdminClient(
  configService: ConfigService,
): SupabaseClient {
  const supabaseUrl = configService.get<string>('SUPABASE_URL')!;
  const serviceRoleKey = configService.get<string>(
    'SUPABASE_SERVICE_ROLE_KEY',
  )!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Admin client uses the service role key for server-side operations only.
      // Token refresh and session persistence are disabled because this client
      // is not tied to any end-user browser session.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
