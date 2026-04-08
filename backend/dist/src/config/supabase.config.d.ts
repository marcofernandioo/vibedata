import { ConfigService } from '@nestjs/config';
import { type SupabaseClient } from '@supabase/supabase-js';
export declare const SUPABASE_ADMIN_CLIENT: unique symbol;
export declare function createSupabaseAdminClient(configService: ConfigService): SupabaseClient;
