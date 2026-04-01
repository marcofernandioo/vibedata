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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const users_repository_1 = require("./users.repository");
let UsersService = UsersService_1 = class UsersService {
    usersRepository;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findOrCreateFromSupabase(supabaseUser) {
        const existingUser = await this.usersRepository.findBySupabaseId(supabaseUser.id);
        const name = this.resolveDisplayName(supabaseUser);
        const avatarUrl = this.resolveAvatarUrl(supabaseUser);
        if (existingUser) {
            return this.usersRepository.update(existingUser.id, {
                email: supabaseUser.email,
                name,
                avatarUrl,
            });
        }
        this.logger.log(`Creating new user for supabaseId=${supabaseUser.id}`);
        return this.usersRepository.create({
            supabaseId: supabaseUser.id,
            email: supabaseUser.email ?? '',
            name,
            avatarUrl,
        });
    }
    updateRole(id, role) {
        return this.usersRepository.update(id, { role });
    }
    updateUser(id, dto) {
        return this.usersRepository.update(id, dto);
    }
    resolveDisplayName(supabaseUser) {
        const metadata = supabaseUser.user_metadata;
        if (typeof metadata?.full_name === 'string') {
            return metadata.full_name;
        }
        if (typeof metadata?.name === 'string') {
            return metadata.name;
        }
        if (typeof supabaseUser.email === 'string') {
            return supabaseUser.email;
        }
        return null;
    }
    resolveAvatarUrl(supabaseUser) {
        const metadata = supabaseUser.user_metadata;
        if (typeof metadata?.avatar_url === 'string') {
            return metadata.avatar_url;
        }
        if (typeof metadata?.picture === 'string') {
            return metadata.picture;
        }
        return null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map