import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorResponse {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
}

type HttpExceptionResponse =
  | string
  | {
      message?: string | string[];
      code?: string;
    };

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const { status, body } = this.resolveException(exception);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }

  private resolveException(exception: unknown): {
    status: number;
    body: ErrorResponse;
  } {
    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    };
  }

  private resolveHttpException(exception: HttpException): {
    status: number;
    body: ErrorResponse;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as HttpExceptionResponse;

    if (
      typeof exceptionResponse === 'object' &&
      Array.isArray(exceptionResponse.message)
    ) {
      return {
        status,
        body: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fieldErrors: this.parseValidationErrors(exceptionResponse.message),
        },
      };
    }

    if (typeof exceptionResponse === 'string') {
      return {
        status,
        body: {
          message: exceptionResponse,
        },
      };
    }

    return {
      status,
      body: {
        message: Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join(', ')
          : (exceptionResponse.message ?? 'An error occurred'),
        code: exceptionResponse.code,
      },
    };
  }

  private resolvePrismaException(
    exception: Prisma.PrismaClientKnownRequestError,
  ): {
    status: number;
    body: ErrorResponse;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          body: {
            message: 'A record with this value already exists',
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
          },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: {
            message: 'Record not found',
            code: 'NOT_FOUND',
          },
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            message: 'Referenced record does not exist',
            code: 'FOREIGN_KEY_VIOLATION',
          },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            message: 'Database error',
            code: 'DATABASE_ERROR',
          },
        };
    }
  }

  private parseValidationErrors(messages: string[]) {
    return messages.reduce<Record<string, string[]>>((fieldErrors, message) => {
      const [field, ...rest] = message.split(' ');
      if (!field) {
        return fieldErrors;
      }

      fieldErrors[field] = [...(fieldErrors[field] ?? []), rest.join(' ')];
      return fieldErrors;
    }, {});
  }
}
