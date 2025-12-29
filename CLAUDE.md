# Helpdesk System - Project Context

## Project Overview
Production-ready helpdesk system built from a single-file React POC (`helpdesk-dashboard.jsx`). Features multi-channel ticket management, client/agent management, service catalog, quote builder, invoicing, and Zoho integration.

## Architecture Decisions

### Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: MySQL 8.0 + Prisma ORM
- **API**: Next.js API Routes
- **State Management**: Zustand (client) + React Query (server state)
- **Styling**: TailwindCSS + Headless UI + Heroicons
- **Authentication**: NextAuth.js with JWT sessions (30-day expiry)
- **Build**: Turborepo 1.10 monorepo
- **Deployment**: Railway (MySQL + Node.js hosting)

### Project Structure (Monorepo)
```
helpdesk-dashboard/
├── apps/
│   └── web/                    # Next.js 14 application
│       ├── src/
│       │   ├── app/            # App Router pages & API routes
│       │   ├── components/     # React components by domain
│       │   ├── stores/         # Zustand state stores
│       │   └── lib/            # Utilities, auth, integrations
│       └── public/             # Static assets
├── packages/
│   ├── database/               # Prisma schema & migrations
│   ├── shared/                 # Shared TypeScript types & validations
│   └── ui/                     # Shared UI components
├── .claude/
│   └── tasks/                  # Task specifications (01-15)
├── scripts/                    # Utility scripts
└── helpdesk-dashboard.jsx      # Original 2,866-line React POC
```

### Database Schema (13 Models)
- **Users & Auth**: `User`, `Agent`
- **Contacts**: `Client` (with Zoho CRM sync)
- **Services**: `Service` (with Zoho Books sync)
- **Tickets**: `Ticket`, `Message`
- **Quotes**: `Quote`, `QuoteItem`, `QuoteStatusLog`
- **Invoices**: `Invoice`, `InvoiceItem`
- **Billing**: `Bill`, `BillItem`

### Key Enums
- `TicketChannel`: WHATSAPP, EMAIL, FORM, CHAT
- `TicketStatus`: OPEN, PENDING, RESOLVED, CLOSED
- `TicketPriority`: LOW, MEDIUM, HIGH, URGENT
- `QuoteStatus`: DRAFT, SENT, PENDING, ACCEPTED, REJECTED, EXPIRED
- `InvoiceStatus`: PENDING, SENT, PAID, OVERDUE

### Business Domains
1. **Tickets**: Multi-channel support (email, WhatsApp, forms, chat)
2. **Clients**: Contact management and profiles
3. **Agents**: Team management with roles (ADMIN, SENIOR_AGENT, AGENT)
4. **Services**: Catalog of 24+ document services with pricing
5. **Quotes**: Service selection and pricing estimates
6. **Invoices**: Billing and payment tracking
7. **Bills**: Agent commission payments

### Integration Strategy
- **Zoho Books**: Services, Invoices, Quotes sync (implemented)
- **Zoho CRM**: Contacts/Clients sync (implemented)
- **Email**: Outlook Graph API (stubbed - Task 14)
- **WhatsApp**: Business API (stubbed - Task 15)

## Development Status

### Completed Tasks
- **Task 01**: Project Setup & Infrastructure
- **Task 02**: Database Schema (Prisma with 13 models)
- **Task 03**: Authentication System (NextAuth.js)
- **Task 04**: Core Dashboard Layout
- **Task 05**: Ticket Management (multi-channel)
- **Task 06**: Client Management (CRUD)
- **Task 07**: Agent Management (CRUD + roles)
- **Task 08**: Messaging System (threads, attachments)
- **Task 09**: Service Catalog (24+ services, 8 categories)
- **Task 10**: Quote Builder (line items, status workflow)
- **Task 11**: Invoice System (payments, status tracking)

### In Progress
- **Task 12**: Commission System & Agent Billing

### Planned
- **Task 13**: Dashboard Analytics
- **Task 14**: Email Integration (Outlook Graph API)
- **Task 15**: WhatsApp Integration (Business API)

### Current Phase
**Status**: ~80% Complete
**Next Step**: Complete Task 12 - Commission System

## API Routes Structure

```
/api/
├── auth/[...nextauth]     # NextAuth handlers
├── tickets/*              # Ticket CRUD + messages
├── clients/*              # Client CRUD + tickets
├── agents/*               # Agent CRUD + stats
├── services/*             # Service CRUD + categories
├── quotes/*               # Quote CRUD + status workflow
├── invoices/*             # Invoice CRUD + payments
├── messages/*             # Message CRUD + attachments
├── webhooks/*             # WhatsApp, Form, Chat webhooks
├── whatsapp/*             # WhatsApp send, templates
├── zoho/*                 # Sync services + OAuth callback
└── portal/*               # Client portal endpoints
```

## Zustand Stores
- `ticketStore.ts` - Ticket filtering and display
- `clientStore.ts` - Client management state
- `agentStore.ts` - Agent list, filters, statistics
- `messageStore.ts` - Message thread state
- `quoteStore.ts` - Quote builder with cart system
- `invoiceStore.ts` - Invoice list and detail state
- `serviceStore.ts` - Service catalog state

## Patterns & Standards
- **Components**: Organized by domain (tickets, clients, agents, messages, quotes, invoices)
- **State**: Zustand stores for client state, React Query for server state
- **API**: RESTful endpoints following `/api/[resource]` pattern
- **Types**: Shared TypeScript definitions in packages/shared
- **Styling**: TailwindCSS utility classes with custom colors (slate-800, slate-900, amber-500)

## Key Files Reference
- **Prisma Schema**: `packages/database/prisma/schema.prisma`
- **Auth Config**: `apps/web/src/lib/auth.ts`
- **Zoho Integration**: `apps/web/src/lib/zoho/`
- **WhatsApp Helpers**: `apps/web/src/lib/whatsapp.ts`
- **Main Layout**: `apps/web/src/components/layout/dashboard-layout.tsx`

## Environment Variables
See `.env.example` for required configuration:
- Database connection (DATABASE_URL)
- NextAuth secrets (NEXTAUTH_SECRET, NEXTAUTH_URL)
- Zoho integration (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORGANIZATION_ID)
- WhatsApp Business API credentials
- Webhook API key

## Implemented Features
- Multi-channel ticket management (WhatsApp, Email, Form, Chat)
- Real-time messaging with file attachments
- Client and agent management with CRUD operations
- Service catalog with 24+ services across 8 categories
- Quote builder with line items and status workflow
- Invoice generation with payment tracking
- Overdue invoice detection
- Agent role-based permissions (ADMIN, SENIOR_AGENT, AGENT)
- Zoho Books/CRM bidirectional sync
- Client-facing ticket portal
- Dashboard overview statistics
