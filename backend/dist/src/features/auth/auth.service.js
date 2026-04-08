"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_config_1 = require("../../config/supabase.config");
const users_service_1 = require("../users/users.service");
let AuthService = AuthService_1 = class AuthService {
    supabaseAdminClient;
    usersService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(supabaseAdminClient, usersService) {
        this.supabaseAdminClient = supabaseAdminClient;
        this.usersService = usersService;
    }
    async syncUserFromAccessToken(accessToken) {
        const { data, error } = await this.supabaseAdminClient.auth.getUser(accessToken);
        if (error || !data.user) {
            this.logger.warn(`Token validation failed: ${error?.message ?? 'no user returned'}`);
            throw new common_1.UnauthorizedException('Invalid or expired access token');
        }
        if (!data.user.email) {
            throw new common_1.UnauthorizedException('Authenticated user is missing an email address');
        }
        const user = await this.usersService.findOrCreateFromSupabase(data.user);
        this.logger.log(`User synced: ${user.email} (${user.id})`);
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(supabase_config_1.SUPABASE_ADMIN_CLIENT)),
    __metadata("design:paramtypes", [Function, users_service_1.UsersService])
], AuthService);
//# sourceMappingURL=auth.service.js.map