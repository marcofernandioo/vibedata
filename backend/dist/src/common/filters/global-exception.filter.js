"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const errorResponse = this.buildErrorResponse(exception);
        if (errorResponse.statusCode >= 500) {
            this.logger.error(`[${errorResponse.statusCode}] ${errorResponse.message}`, exception instanceof Error ? exception.stack : undefined);
        }
        else {
            this.logger.warn(`[${errorResponse.statusCode}] ${errorResponse.message}`);
        }
        response.status(errorResponse.statusCode).json(errorResponse);
    }
    buildErrorResponse(exception) {
        if (exception instanceof common_1.HttpException) {
            return this.handleHttpException(exception);
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.handlePrismaError(exception);
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
        };
    }
    handleHttpException(exception) {
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        if (typeof exceptionResponse === 'string') {
            return { statusCode: status, message: exceptionResponse };
        }
        const responseBody = exceptionResponse;
        if (Array.isArray(responseBody.message)) {
            const fieldErrors = {};
            for (const msg of responseBody.message) {
                const field = msg.split(' ')[0] ?? 'unknown';
                if (!fieldErrors[field]) {
                    fieldErrors[field] = [];
                }
                fieldErrors[field].push(msg);
            }
            return {
                statusCode: status,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                fieldErrors,
            };
        }
        return {
            statusCode: status,
            message: responseBody.message ?? 'Request failed',
        };
    }
    handlePrismaError(exception) {
        switch (exception.code) {
            case 'P2002': {
                const target = exception.meta?.target?.join(', ') ?? 'field';
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
                    message: `A record with this ${target} already exists`,
                    code: 'UNIQUE_CONSTRAINT',
                };
            }
            case 'P2025':
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    message: 'Record not found',
                    code: 'NOT_FOUND',
                };
            case 'P2003':
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Related record not found',
                    code: 'FOREIGN_KEY_CONSTRAINT',
                };
            default:
                return {
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'A database error occurred',
                    code: 'DATABASE_ERROR',
                };
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map