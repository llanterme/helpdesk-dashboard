# Helpdesk System - Project Context

## Project Overview
Transform single-file React POC (`helpdesk-dashboard.jsx`) into production-ready helpdesk system with multi-channel ticket management, client/agent management, service catalog, and billing system.

## Architecture Decisions

### Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: MySQL 8.0 + Prisma ORM
- **API**: Next.js API Routes (simpler than separate Express)
- **State Management**: Zustand (client) + React Query (server state)
- **Styling**: TailwindCSS (matches existing POC)
- **Authentication**: NextAuth.js with email/password
- **Deployment**: Railway (MySQL + Node.js hosting)

### Project Structure (Monorepo)
```
helpdesk-system/
├── apps/
│   └── web/                    # Next.js application
├── packages/
│   ├── database/               # Prisma schema & migrations
│   ├── shared/                 # Shared TypeScript types
│   └── ui/                     # Shared UI components
```

### Business Domains
1. **Tickets**: Multi-channel support (email, WhatsApp, forms, chat)
2. **Clients**: Contact management and profiles
3. **Agents**: Team management with roles and commissions
4. **Services**: Catalog of 18+ document services with pricing
5. **Quotes**: Service selection and pricing estimates
6. **Invoices**: Billing and payment tracking
7. **Bills**: Agent commission payments

### Integration Strategy
- **Email**: Outlook Graph API (initially stubbed with console logging)
- **WhatsApp**: Business API (initially stubbed with console logging)
- **Migration Path**: Replace stubs with real API calls after core system is stable

## Development Approach

### Task-Based Implementation
Each feature developed as independent, testable unit with:
- Clear acceptance criteria
- Progressive complexity
- Consistent architectural patterns
- Individual testing requirements

### Patterns & Standards
- **Components**: Atomic design principles (atoms, molecules, organisms)
- **State**: Zustand stores for client state, React Query for server state
- **API**: RESTful endpoints following `/api/[resource]` pattern
- **Types**: Shared TypeScript definitions in packages/shared
- **Styling**: TailwindCSS utility classes, component variants
- **Testing**: Jest + React Testing Library for components, API testing

### Current Status
**Phase**: Planning Complete
**Next Step**: Task 01 - Project Setup & Infrastructure

## Key Features from POC
✅ Multi-channel ticket management
✅ Real-time messaging interface
✅ Client and agent management
✅ Service catalog with pricing
✅ Quote builder with line items
✅ Invoice generation and tracking
✅ Agent commission system
✅ Dashboard analytics and filtering
✅ Status workflow management
✅ File attachment support (planned)

## Removed Features
❌ Zoho Books integration (removed per requirements)
❌ Complex multi-tenant support (future enhancement)