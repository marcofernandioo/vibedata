"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponseDto = void 0;
class UserResponseDto {
    id;
    email;
    name;
    avatarUrl;
    role;
    isActive;
    createdAt;
    constructor(user) {
        this.id = user.id;
        this.email = user.email;
        this.name = user.name;
        this.avatarUrl = user.avatarUrl;
        this.role = user.role;
        this.isActive = user.isActive;
        this.createdAt = user.createdAt;
    }
    static from(user) {
        return new UserResponseDto(user);
    }
}
exports.UserResponseDto = UserResponseDto;
//# sourceMappingURL=user-response.dto.js.map