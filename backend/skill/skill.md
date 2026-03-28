---
name: nestjs-prisma-postgresql
description: Production-grade NestJS + Prisma + PostgreSQL architecture skill. Use when building or reviewing backend REST APIs that need scalable structure, clean validation pipelines, standardized error responses, safe migrations, auth patterns, and a database layer that doesn't bleed into business logic. Covers decision trees, rationale, and annotated code for real SaaS and data-heavy applications.
references:
  - https://github.com/alan2207/bulletproof-react (frontend counterpart)
  - https://github.com/nestjs/awesome-nestjs
  - https://github.com/notiz-dev/nestjs-prisma-starter
stack:
  - NestJS 10+
  - TypeScript (strict)
  - Prisma ORM
  - PostgreSQL
  - class-validator + class-transformer (validation)
  - @nestjs/config (environment)
  - @nestjs/jwt + @nestjs/passport (auth)
  - Swagger (@nestjs/swagger)
  - Jest (testing)
frontend_contract:
  error_shape: '{ message: string, code?: string, fieldErrors?: Record<string, string[]> }'
  paginated_shape: '{ data: T[], meta: { total: number, page: number, pageSize: number } }'
---

# NestJS + Prisma + PostgreSQL Production Skill

## Core Philosophy (Read This First)

Three rules. Every decision in this skill flows from them.

1. **Controllers are traffic directors, not business logic containers.** A controller receives a request, hands it to a service, and returns the result. If your controller has an if-statement that isn't about the HTTP layer, it's in the wrong place.

2. **Services own business logic, not database logic.** A service should read like a description of what the application does, not how the database works. The moment a service starts building Prisma `where` clauses inline, it has taken on a responsibility that belongs in a repository.

3. **The API contract is a promise to the frontend.** Every error, every success response, every paginated list follows the same shape. Always. The frontend skill is built on top of this contract — breaking it breaks the frontend.

---

## Response Contract (Non-Negotiable)

These two shapes are the shared language between this skill and the React frontend skill. Every endpoint produces one of them.

### Error Shape
```typescript
{
  message: string           // Human-readable, shown in toast notifications
  code?: string             // Machine-readable, for frontend logic branching
  fieldErrors?: Record<string, string[]>  // Keyed by field name, shown inline in forms
}
```

### Paginated Response Shape
```typescript
{
  data: T[]
  meta: {
    total: number     // total records matching the query (not just this page)
    page: number      // current page (1-indexed)
    pageSize: number  // records per page
  }
}
```

---

## 1. Project Structure

### Rule
Feature-based, not type-based. `controllers/`, `services/`, `repositories/` at the root is a trap — it tells you nothing about what the app does. Feature folders tell you everything.

```
src/
├── main.ts                     # Bootstrap, global pipes, swagger setup
├── app.module.ts               # Root module — imports feature modules only
├── config/                     # Environment & config
│   ├── env.validation.ts       # Zod/Joi schema for env vars
│   └── configuration.ts        # Typed config factory
├── common/                     # Shared across all features
│   ├── decorators/             # @CurrentUser(), @Public(), @Roles()
│   ├── filters/                # GlobalExceptionFilter
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   ├── interceptors/           # TransformInterceptor (response envelope)
│   ├── pipes/                  # Already covered by ValidationPipe global
│   ├── dto/                    # Shared DTOs (PaginationDto, etc.)
│   └── types/                  # Shared TypeScript types
├── prisma/                     # Prisma setup
│   ├── prisma.service.ts       # PrismaClient singleton
│   ├── prisma.module.ts        # Global module
│   └── schema.prisma           # (symlink or reference — actual file at root)
└── features/                   # One folder per domain
    └── orders/
        ├── orders.module.ts
        ├── orders.controller.ts
        ├── orders.service.ts
        ├── orders.repository.ts    # Database logic lives here
        ├── dto/
        │   ├── create-order.dto.ts
        │   ├── update-order.dto.ts
        │   └── order-query.dto.ts  # Pagination, filters, sort params
        └── types/
            └── order.types.ts
```

### The File Creation Order for a New Feature
Always in this sequence — each file depends on the one before it:

1. `schema.prisma` — define the model first
2. Migration — run `prisma migrate dev`
3. `*.types.ts` — TypeScript types derived from Prisma
4. `*.dto.ts` files — validation contracts for request bodies
5. `*.repository.ts` — database query methods
6. `*.service.ts` — business logic using the repository
7. `*.controller.ts` — HTTP layer calling the service
8. `*.module.ts` — wire everything together

If you start with the controller, you're building on undefined foundations.

---

## 2. Module Structure & Dependency Injection

### The Module Pattern
Every feature is a self-contained module. It declares what it provides and what it imports. NestJS's DI container handles instantiation.

```typescript
// features/orders/orders.module.ts
import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { OrdersRepository } from './orders.repository'
import { PrismaModule } from '@/prisma/prisma.module'

@Module({
  imports: [PrismaModule],   // Import modules that provide services you need
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],  // Export ONLY what other modules legitimately need
})
export class OrdersModule {}
```

### PrismaModule — Global, Not Re-imported Everywhere
```typescript
// prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global()  // Makes PrismaService available everywhere without importing PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }
  // onModuleDestroy handled automatically by NestJS lifecycle
}
```

### What Dependency Injection Actually Means for You
Stop calling `new Service()`. NestJS creates one instance of each provider per module scope and injects it wherever it's declared in the constructor. This is why testing works — you can inject a mock instead of a real implementation.

```typescript
// ✅ Correct — NestJS injects both
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly configService: ConfigService,
  ) {}
}

// ❌ Wrong — bypasses DI, untestable
@Injectable()
export class OrdersService {
  private readonly repo = new OrdersRepository() // never do this
}
```

---

## 3. Validation & the DTO Contract

### The Stack
`class-validator` + `class-transformer` + NestJS `ValidationPipe`. No custom validation functions. No manual if-statements. Schema-first, always.

### Global Setup (`main.ts`)
```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip properties not in the DTO — prevents injection
      forbidNonWhitelisted: true, // Throw if unknown properties are sent
      transform: true,        // Auto-transform payload to DTO class instances
      transformOptions: {
        enableImplicitConversion: true, // Converts "1" → 1 for @IsNumber() fields
      },
    }),
  )

  await app.listen(3000)
}
```

`whitelist: true` is not optional. Without it, a client can send arbitrary fields and they'll pass through to your service. That's a security hole.

### DTO Patterns
```typescript
// features/orders/dto/create-order.dto.ts
import {
  IsString, IsNumber, IsEnum, IsOptional,
  IsArray, ValidateNested, Min, IsUUID
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class OrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  customerId: string

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })  // Validates each item in the array
  @Type(() => OrderItemDto)        // class-transformer needs this for nested objects
  items: OrderItemDto[]

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string
}
```

### Query DTO — Pagination, Filtering, Sorting
```typescript
// common/dto/pagination.dto.ts
import { IsNumber, IsOptional, Min, Max, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)  // Hard cap — never let the client fetch unlimited records
  pageSize?: number = 20
}

// features/orders/dto/order-query.dto.ts
import { IsOptional, IsEnum, IsString } from 'class-validator'
import { IntersectionType } from '@nestjs/swagger'

export class OrderQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ enum: ['createdAt', 'total', 'status'] })
  @IsOptional()
  @IsEnum(['createdAt', 'total', 'status'])
  sortBy?: string = 'createdAt'

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}
```

### What Happens When Validation Fails
With the global `ValidationPipe`, a failed validation automatically returns a 400 with class-validator's error format. But that format doesn't match our frontend contract. Fix it in the global exception filter (Section 4).

---

## 4. Error Handling & Response Standardization

### The Global Exception Filter
This single file is responsible for every error response leaving the API. It normalizes NestJS exceptions, Prisma errors, and unexpected errors into the frontend contract shape.

```typescript
// common/filters/global-exception.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const { status, body } = this.resolveException(exception)

    // Log 5xx errors — not 4xx (those are client errors, not your problem)
    if (status >= 500) {
      this.logger.error(exception, { url: request.url, method: request.method })
    }

    response.status(status).json(body)
  }

  private resolveException(exception: unknown): {
    status: number
    body: ErrorResponse
  } {
    // NestJS HTTP exceptions (NotFoundException, UnauthorizedException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      // class-validator produces { message: string[], error: string }
      // Normalize to our field error contract
      if (
        typeof exceptionResponse === 'object' &&
        Array.isArray((exceptionResponse as any).message)
      ) {
        return {
          status,
          body: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            fieldErrors: this.parseValidationErrors(
              (exceptionResponse as any).message
            ),
          },
        }
      }

      return {
        status,
        body: {
          message:
            typeof exceptionResponse === 'string'
              ? exceptionResponse
              : (exceptionResponse as any).message ?? 'An error occurred',
          code: (exceptionResponse as any).code,
        },
      }
    }

    // Prisma known errors — map to meaningful HTTP responses
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception)
    }

    // Unknown errors — never leak internals to the client
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    }
  }

  private resolvePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number
    body: ErrorResponse
  } {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          body: {
            message: 'A record with this value already exists',
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            // error.meta.target contains the field name(s)
          },
        }
      case 'P2025': // Record not found (e.g., update/delete on non-existent record)
        return {
          status: HttpStatus.NOT_FOUND,
          body: { message: 'Record not found', code: 'NOT_FOUND' },
        }
      case 'P2003': // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            message: 'Referenced record does not exist',
            code: 'FOREIGN_KEY_VIOLATION',
          },
        }
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: { message: 'Database error', code: 'DATABASE_ERROR' },
        }
    }
  }

  // Converts class-validator messages like "items.0.quantity must be a number"
  // into { "items[0].quantity": ["must be a number"] }
  private parseValidationErrors(
    messages: string[]
  ): Record<string, string[]> {
    return messages.reduce((acc, message) => {
      // Extract field name from the message prefix
      const parts = message.split(' ')
      const field = parts[0]
      const error = parts.slice(1).join(' ')
      acc[field] = [...(acc[field] ?? []), error]
      return acc
    }, {} as Record<string, string[]>)
  }
}

interface ErrorResponse {
  message: string
  code?: string
  fieldErrors?: Record<string, string[]>
}
```

Register globally in `main.ts`:
```typescript
app.useGlobalFilters(new GlobalExceptionFilter())
```

### Response Transform Interceptor
Standardizes success responses. Every successful response is wrapped consistently.

```typescript
// common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

// Services return plain data. This interceptor wraps it.
// Paginated responses (with data + meta) pass through as-is.
// Everything else gets a consistent envelope if needed.

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => data) // passthrough — add envelope logic here if desired
    )
  }
}
```

### Throwing Errors in Services
Use NestJS built-in exceptions. Never return error objects — throw.

```typescript
// ✅ Correct
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common'

async findOne(id: string, requestingUserId: string): Promise<Order> {
  const order = await this.ordersRepository.findById(id)

  if (!order) throw new NotFoundException('Order not found')

  if (order.customerId !== requestingUserId) {
    throw new ForbiddenException('You do not have access to this order')
  }

  return order
}

// ❌ Wrong — returns errors as data, forces controller to check
async findOne(id: string): Promise<Order | null> {
  return this.ordersRepository.findById(id) // null is not an error, it's ambiguity
}
```

---

## 5. Database Layer — Prisma Patterns

### The Repository Pattern
Your service should not know what a Prisma `where` clause looks like. That's the repository's job. This separation means:
- Services are readable as business logic
- Database queries are testable in isolation
- Switching from Prisma to raw SQL only changes the repository, not the service

```typescript
// features/orders/orders.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { Prisma, Order } from '@prisma/client'
import type { OrderQueryDto } from './dto/order-query.dto'

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Build query once, reuse for both data and count
  private buildWhere(query: OrderQueryDto): Prisma.OrderWhereInput {
    return {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { customer: { name: { contains: query.search, mode: 'insensitive' } } },
          { id: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    }
  }

  async findMany(query: OrderQueryDto): Promise<{ data: Order[]; total: number }> {
    const where = this.buildWhere(query)
    const skip = (query.page - 1) * query.pageSize

    // Run count and data fetch in parallel — never sequentially
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { customer: true, items: { include: { product: true } } },
      }),
      this.prisma.order.count({ where }),
    ])

    return { data, total }
  }

  async findById(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } } },
    })
  }

  async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({ data })
  }

  async update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } })
    // P2025 thrown automatically if record doesn't exist — caught by global filter
  }
}
```

### The Service Layer
Reads as business logic. Zero Prisma internals.

```typescript
// features/orders/orders.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { OrdersRepository } from './orders.repository'
import type { CreateOrderDto } from './dto/create-order.dto'
import type { OrderQueryDto } from './dto/order-query.dto'
import type { PaginatedResponse } from '@/common/types'

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async findAll(query: OrderQueryDto): Promise<PaginatedResponse<Order>> {
    const { data, total } = await this.ordersRepository.findMany(query)
    return {
      data,
      meta: { total, page: query.page, pageSize: query.pageSize },
    }
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findById(id)
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    // Business logic lives here — validation, transformation, side effects
    const orderData = this.buildOrderCreateInput(dto)
    return this.ordersRepository.create(orderData)
  }

  private buildOrderCreateInput(dto: CreateOrderDto): Prisma.OrderCreateInput {
    return {
      customer: { connect: { id: dto.customerId } },
      items: {
        create: dto.items.map((item) => ({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
        })),
      },
      notes: dto.notes,
    }
  }
}
```

### The Controller
Traffic director only. No logic.

```typescript
// features/orders/orders.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderQueryDto } from './dto/order-query.dto'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto)
  }
}
```

### N+1 Queries — The Silent Performance Killer
The N+1 problem: you fetch 20 orders, then for each order you fetch the customer — that's 21 queries instead of 1.

```typescript
// ❌ N+1 — one query per order to get customer
const orders = await prisma.order.findMany()
const ordersWithCustomers = await Promise.all(
  orders.map(async (order) => ({
    ...order,
    customer: await prisma.customer.findUnique({ where: { id: order.customerId } })
  }))
)

// ✅ Single query with JOIN via include
const orders = await prisma.order.findMany({
  include: { customer: true }
})
```

### select vs include — Performance Decision
```typescript
// include fetches entire related record — use when you need the full shape
include: { customer: true }

// select fetches only specified fields — use in list endpoints to reduce payload
select: {
  id: true,
  status: true,
  createdAt: true,
  customer: {
    select: { id: true, name: true, email: true }
    // NOT: select: { passwordHash: true } — never return sensitive fields
  }
}
```

Rule: use `include` in detail endpoints (single record). Use `select` in list endpoints (many records). Never return full records with all relations in paginated lists.

### Transactions — When Multiple Operations Must Succeed Together
```typescript
// Use $transaction when failure of one operation should roll back all others
async transferOrder(orderId: string, newCustomerId: string): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // All operations use the transaction client `tx`, not `this.prisma`
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')

    await tx.order.update({
      where: { id: orderId },
      data: { customerId: newCustomerId }
    })

    await tx.auditLog.create({
      data: { action: 'ORDER_TRANSFERRED', orderId, newCustomerId }
    })
    // If auditLog.create fails, the order.update is rolled back automatically
  })
}
```

---

## 6. Migrations — What to Review Before Running

### The Migration Workflow
```bash
# Development — creates migration file AND applies it
npx prisma migrate dev --name add_orders_table

# Production — ONLY applies existing migration files, never generates
npx prisma migrate deploy

# Never run migrate dev in production — it can reset your database
```

### What to Review in Every Generated Migration File
Auto-generated migrations are mostly safe. These specific patterns are not:

**1. Column drops**
```sql
-- DANGER: irreversible data loss
ALTER TABLE "orders" DROP COLUMN "legacy_field";
```
If this is unintentional (you renamed a field in schema.prisma), Prisma interprets rename as drop + add. Fix by adding `@map` to preserve the column name, or migrate data before dropping.

**2. NOT NULL additions on existing tables**
```sql
-- DANGER: fails if existing rows have NULL in this column
ALTER TABLE "orders" ALTER COLUMN "status" SET NOT NULL;
```
Safe approach: add as nullable → backfill → add NOT NULL in a separate migration.

**3. Index creation on large tables**
```sql
-- On a large table, this locks the table during index build
CREATE INDEX "orders_customer_id_idx" ON "orders"("customerId");

-- Safe alternative (PostgreSQL only) — add to migration manually
CREATE INDEX CONCURRENTLY "orders_customer_id_idx" ON "orders"("customerId");
```

**4. Enum additions**
Prisma handles enum additions safely. Enum removals are not safe if existing data uses the removed value.

### Schema Conventions
```prisma
// schema.prisma
model Order {
  id         String      @id @default(cuid())  // cuid over uuid — shorter, URL-safe
  status     OrderStatus @default(PENDING)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt             // Auto-updates on every write

  customerId String
  customer   Customer    @relation(fields: [customerId], references: [id])

  items      OrderItem[]

  @@index([customerId])          // Index foreign keys — always
  @@index([status, createdAt])   // Index fields you filter and sort by together
}

enum OrderStatus {
  PENDING
  CONFIRMED
  CANCELLED
}
```

Index every foreign key. Index every field combination that appears in your `where` + `orderBy` clauses together. Without indexes, queries on large tables do full table scans.

---

## 7. Auth — JWT, Guards, Role-Based Access

### Setup
```typescript
// features/auth/auth.module.ts
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '15m') },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### JWT Strategy
```typescript
// common/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

export interface JwtPayload {
  sub: string        // user id
  email: string
  role: string
  iat: number
  exp: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
      ignoreExpiration: false,
    })
  }

  async validate(payload: JwtPayload) {
    // This runs on EVERY authenticated request
    // Keep it lean — only fetch what you need for auth decisions
    const user = await this.usersRepository.findById(payload.sub)
    if (!user || !user.isActive) throw new UnauthorizedException()
    return user  // Attached to request.user
  }
}
```

### Role-Based Access
```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common'
export const Roles = (...roles: string[]) => SetMetadata('roles', roles)

// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) return true  // No roles required — open to all authenticated users

    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.includes(user.role)
  }
}

// Usage in controller
@Delete(':id')
@Roles('admin')   // Only admins can delete
remove(@Param('id') id: string) {
  return this.ordersService.remove(id)
}
```

### Current User Decorator
```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)

// Usage in controller
@Get('me/orders')
getMyOrders(@CurrentUser() user: User, @Query() query: OrderQueryDto) {
  return this.ordersService.findAllForUser(user.id, query)
}
```

---

## 8. Configuration & Environment Management

```typescript
// config/env.validation.ts
import { plainToClass } from 'class-transformer'
import { IsString, IsNumber, IsEnum, validateSync, Min } from 'class-validator'

enum Environment { Development = 'development', Production = 'production', Test = 'test' }

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment

  @IsString()
  DATABASE_URL: string

  @IsString()
  JWT_SECRET: string

  @IsNumber()
  @Min(1)
  PORT: number = 3000
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validated)
  if (errors.length > 0) {
    // Crash at startup if env is misconfigured — fail loudly, not silently
    throw new Error(`Environment validation failed:\n${errors.toString()}`)
  }
  return validated
}
```

```typescript
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validate: validateEnv,
  envFilePath: ['.env.local', '.env'],
})
```

---

## 9. Testing — The Pragmatic Minimum

### The Honest Take
100% coverage is a vanity metric. The goal is catching real bugs before prod. For a SaaS backend, this means:

**Write tests for:**
- Service layer business logic — this is where bugs live
- Auth guards and role checks — security failures are expensive
- Complex repository queries — especially anything with transactions
- Any function that handles money, permissions, or data deletion

**Skip tests for:**
- Controllers — they're just wiring, covered by e2e
- Simple CRUD repositories with no logic
- DTOs — class-validator handles this

### Service Unit Test Pattern
```typescript
// features/orders/orders.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { OrdersService } from './orders.service'
import { OrdersRepository } from './orders.repository'
import { NotFoundException } from '@nestjs/common'

// Mock the repository — services should never touch a real DB in unit tests
const mockOrdersRepository = {
  findById: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

describe('OrdersService', () => {
  let service: OrdersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: mockOrdersRepository },
      ],
    }).compile()

    service = module.get<OrdersService>(OrdersService)
    jest.clearAllMocks()
  })

  describe('findOne', () => {
    it('returns order when found', async () => {
      const order = { id: '1', status: 'PENDING' }
      mockOrdersRepository.findById.mockResolvedValue(order)

      const result = await service.findOne('1')
      expect(result).toEqual(order)
    })

    it('throws NotFoundException when order does not exist', async () => {
      mockOrdersRepository.findById.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })
})
```

---

## 10. Logging & Observability

### Built-in Logger
```typescript
// Use NestJS Logger — not console.log
import { Logger } from '@nestjs/common'

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  async create(dto: CreateOrderDto): Promise<Order> {
    this.logger.log(`Creating order for customer ${dto.customerId}`)
    try {
      const order = await this.ordersRepository.create(...)
      this.logger.log(`Order created: ${order.id}`)
      return order
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack)
      throw error
    }
  }
}
```

### What to Log
- Service-level operations (created, updated, deleted) with entity IDs — not PII
- All errors at the service layer before re-throwing
- Auth events (login, logout, failed attempts) — always
- Never log passwords, tokens, or sensitive field values

---

## 11. Performance

### Query Optimization Checklist
Before any query goes to prod, verify:

1. **Is there an index on every field in `where`?** If not, add one in schema.prisma.
2. **Is there an index on every field in `orderBy`?** Sorting without an index is a full table scan.
3. **Are you using `select` in list endpoints?** `include` on a paginated list of 100 records with 5 relations = 100 × 5 joined rows minimum.
4. **Are you running count and data as parallel queries?** `$transaction([findMany, count])` not sequential awaits.
5. **Are you paginating?** Never `findMany()` without `take`. No client should ever fetch unbounded records.

### Connection Pooling
Prisma manages its own connection pool. The default is fine for most apps. For high-traffic APIs:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection limit to the URL if needed:
  // postgresql://user:pass@host/db?connection_limit=20
}
```

---

## 12. Security Fundamentals

### Rate Limiting
```typescript
// main.ts
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

// In AppModule imports:
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])  // 100 requests per minute

// Apply globally or per-controller
app.useGlobalGuards(new ThrottlerGuard())
```

### CORS
```typescript
// main.ts — be explicit, never use origin: '*' in production
app.enableCors({
  origin: [configService.get('FRONTEND_URL')],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
})
```

### Never Return These Fields
Create a pattern for stripping sensitive fields before returning user records:
```typescript
// common/utils/sanitize.ts
export function sanitizeUser(user: User): PublicUser {
  const { passwordHash, refreshToken, ...publicUser } = user
  return publicUser
}
```

---

## 13. API Versioning & Swagger

### Versioning
```typescript
// main.ts
app.enableVersioning({ type: VersioningType.URI })  // /v1/orders

// Controller
@Controller({ path: 'orders', version: '1' })
```

### Swagger
```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('docs', app, document)
// Available at: /docs
```

Decorate DTOs with `@ApiProperty()` as you write them — not as an afterthought. Swagger is the contract documentation your frontend dev reads. Keep it accurate.