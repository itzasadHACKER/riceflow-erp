# Contributing to RiceFlow ERP

## Development Setup

See [README.md](README.md) for initial setup instructions.

## Project Architecture

RiceFlow uses a **Modular Monolith** architecture:

- **Backend**: NestJS with domain-driven modules
- **Frontend**: Next.js 16 App Router with ShadCN UI
- **Database**: PostgreSQL via Prisma ORM
- **State**: Zustand (client), React Query (server)

### Module Structure (Backend)

Each domain module follows this pattern:

```
src/modules/<module-name>/
├── <module-name>.module.ts       # NestJS module declaration
├── <module-name>.controller.ts   # REST endpoints
├── <module-name>.service.ts      # Business logic
├── dto/                          # Request/response DTOs
│   ├── create-<entity>.dto.ts
│   └── update-<entity>.dto.ts
└── guards/                       # Module-specific guards (if any)
```

### Frontend Structure

```
src/
├── app/                          # Next.js App Router (pages & layouts)
│   ├── (auth)/                   # Auth route group (login, register)
│   └── dashboard/                # Dashboard route group
├── components/
│   ├── layout/                   # Layout components (sidebar, header)
│   ├── providers/                # Context providers
│   └── ui/                       # ShadCN UI primitives
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities (API client, helpers)
└── stores/                       # Zustand stores
```

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` types — use proper interfaces
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `readonly` for immutable data

### Backend

- All endpoints must have Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`)
- Request validation via `class-validator` DTOs
- Services handle business logic; controllers handle HTTP concerns only
- Use Prisma transactions for multi-step writes
- All business entities must include `organizationId` for multi-tenancy

### Frontend

- Server Components by default (no `'use client'` unless needed)
- Add `'use client'` only when using: state, event handlers, browser APIs, hooks
- Use `buttonVariants` + `Link` instead of `<Button asChild>` (ShadCN v4 uses base-ui, not Radix)
- Use `render` prop for polymorphic ShadCN components (e.g., `<SidebarMenuButton render={<Link />}>`)

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `paddy-purchase.service.ts` |
| Classes | PascalCase | `PaddyPurchaseService` |
| Functions | camelCase | `calculateMoistureDeduction` |
| Constants | UPPER_SNAKE | `MAX_MOISTURE_LEVEL` |
| DB tables | PascalCase (Prisma) | `PaddyPurchase` |
| DB columns | camelCase (Prisma) | `moistureLevel` |
| API routes | kebab-case | `/paddy-purchases` |
| Components | PascalCase | `PurchaseForm.tsx` |

## Git Workflow

### Branch Naming

```
feat/<description>      # New features
fix/<description>       # Bug fixes
refactor/<description>  # Code refactoring
docs/<description>      # Documentation
chore/<description>     # Maintenance
```

### Commit Messages

Follow [Conventional Commits](https://conventionalcommits.org/):

```
feat: add paddy moisture calculation
fix: correct yield percentage formula
refactor: extract inventory valuation into service
docs: add API endpoint documentation
chore: upgrade Prisma to v6.20
```

### Pull Requests

1. Create a feature branch from `main`
2. Make focused, atomic commits
3. Ensure lint and build pass: `npm run lint && npm run build`
4. Write a clear PR description explaining what and why
5. Request review

## Database

### Migrations

```bash
cd apps/backend

# Create migration after schema changes
npx prisma migrate dev --name <description>

# Reset database (dev only)
npx prisma migrate reset

# View database
npx prisma studio
```

### Schema Rules

- All IDs are UUIDs (`@default(uuid())`)
- All monetary values use `Decimal(18, 4)`
- Soft deletes via `deletedAt DateTime?`
- Audit columns: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- Multi-tenancy via `organizationId` on all business tables
- Add indexes for frequently queried columns

## API Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```
