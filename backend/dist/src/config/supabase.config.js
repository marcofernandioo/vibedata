"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPABASE_ADMIN_CLIENT = void 0;
exports.createSupabaseAdminClient = createSupabaseAdminClient;
const supabase_js_1 = require("@supabase/supabase-js");
exports.SUPABASE_ADMIN_CLIENT = Symbol('SUPABASE_ADMIN_CLIENT');
function createSupabaseAdminClient(configService) {
    const supabaseUrl = configService.get('SUPABASE_URL');
    const serviceRoleKey = configService.get('SUPABASE_SERVICE_ROLE_KEY');
    return (0, supabase_js_1.createClient)(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
//# sourceMappingURL=supabase.config.js.map