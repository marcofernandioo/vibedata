# Vibedata Backend

NestJS API with Supabase authentication, Prisma ORM, and PostgreSQL.

## Features

- **Authentication**: Supabase OAuth 2.0 (Google) + email/password, JWT validation via service-role admin client
- **Authorization**: Global `SupabaseAuthGuard` + `RolesGuard` with RBAC (`USER`, `ADMIN`)
- **Database**: Prisma ORM with PostgreSQL, User model with Supabase ID sync
- **API standards**: Global exception filter (structured errors), response transform interceptor, class-validator DTOs
- **Architecture**: Feature-based modules (`auth`, `users`, `analytics`), repository pattern for data access

## Project Structure

```
src/
├── main.ts                          # Bootstrap, CORS, global pipes/filters/interceptors
├── app.module.ts                    # Root module, global guards
├── config/                          # Env validation, Supabase admin client factory
├── prisma/                          # PrismaService (global module)
├── common/
│   ├── decorators/                  # @Public(), @CurrentUser(), @Roles()
│   ├── guards/                      # SupabaseAuthGuard, RolesGuard
│   ├── filters/                     # GlobalExceptionFilter
│   ├── interceptors/                # TransformInterceptor
│   ├── dto/                         # PaginationDto
│   └── types/                       # AuthenticatedRequest, PaginatedResponse
└── features/
    ├── auth/                        # Auth controller/service, callback + me endpoints
    ├── users/                       # UsersService, UsersRepository, DTOs
    └── analytics/                   # Scaffolding (controller, service, repository)
```

## Setup

1. Copy `.env.example` to `.env` and fill in the values:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vibedata"
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
   FRONTEND_URL="http://localhost:5173"
   PORT=3000
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run Prisma migration (requires `DATABASE_URL`):

   ```bash
   npx prisma migrate dev
   ```

4. Start the dev server:

   ```bash
   npm run start:dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled output |
| `npm run test` | Unit tests (Jest) |
| `npm run test:e2e` | End-to-end tests |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
