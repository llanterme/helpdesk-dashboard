# Helpdesk System - Project Context

## Project Overview
Production-ready helpdesk system built from a single-file React POC (`helpdesk-dashboard.jsx`). Features multi-channel ticket management, client/agent management, service catalog, quote builder, invoicing, and full Zoho Books/CRM integration.

## Architecture Decisions

### Tech Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM (Railway hosted)
- **API**: Next.js API Routes
- **State Management**: Zustand (client) + React Query (server state)
- **Styling**: TailwindCSS + Headless UI + Heroicons
- **Authentication**: NextAuth.js with JWT sessions (30-day expiry)
- **Build**: Turborepo 1.10 monorepo
- **Deployment**: Railway (PostgreSQL + Node.js hosting)

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
├── docs/                       # Documentation
│   └── INTEGRATION_DESIGN.md   # Zoho integration architecture
├── .claude/
│   └── tasks/                  # Task specifications (01-15)
├── scripts/                    # Utility scripts
└── helpdesk-dashboard.jsx      # Original 2,866-line React POC
```

### Database Schema (17 Models)
- **Users & Auth**: `User`, `Agent`
- **Contacts**: `Client` (with Zoho CRM/Books sync)
- **Services**: `Service` (with Zoho Books sync)
- **Tickets**: `Ticket`, `Message`, `Attachment`
- **Quotes**: `Quote`, `QuoteItem`, `QuoteStatusLog`
- **Invoices**: `Invoice`, `InvoiceItem`
- **Billing**: `Bill`, `BillItem`
- **Sync**: `SyncLog` (audit trail for Zoho sync)
- **Email**: `EmailAccount`, `EmailTemplate`

### Key Enums
- `TicketChannel`: WHATSAPP, EMAIL, FORM, CHAT
- `TicketStatus`: OPEN, PENDING, RESOLVED, CLOSED
- `TicketPriority`: LOW, MEDIUM, HIGH, URGENT
- `QuoteStatus`: DRAFT, SENT, PENDING, ACCEPTED, REJECTED, EXPIRED
- `InvoiceStatus`: PENDING, SENT, PAID, OVERDUE
- `SyncStatus`: PENDING, SYNCED, FAILED, CONFLICT
- `SyncDirection`: TO_ZOHO, FROM_ZOHO

### Business Domains
1. **Tickets**: Multi-channel support (email, WhatsApp, forms, chat)
2. **Clients**: Contact management with Zoho sync
3. **Agents**: Team management with roles (ADMIN, SENIOR_AGENT, AGENT)
4. **Services**: Catalog of 36+ document services with Zoho pricing sync
5. **Quotes**: Service selection → Zoho Estimates
6. **Invoices**: Billing → Zoho Invoices with payment tracking
7. **Bills**: Agent commission payments

## Zoho Integration (Complete)

### Configured Credentials
- **Organization**: Easy Services Group (PTY) LTD (ID: 867037917)
- **Region**: com (US)
- **Scopes**: ZohoBooks.fullaccess.all, ZohoCRM.modules.ALL, Desk.tickets.ALL, Desk.contacts.ALL, Desk.basic.ALL

### Sync Features
| Entity | Direction | Feature |
|--------|-----------|---------|
| **Clients** | ↔ Bidirectional | Pull from Books, Push to Books + CRM |
| **Services** | ← From Zoho | Pull Items with auto-categorization |
| **Quotes** | → To Zoho | Create/update Estimates, status sync |
| **Invoices** | → To Zoho | Create/update Invoices, payment recording |
| **WhatsApp Tickets** | ↔ Bidirectional | Sync via Zoho Desk + HelloSend |

### Zoho Desk Integration (WhatsApp)
- **Flow**: WhatsApp → HelloSend → Zoho Desk → Helpdesk (webhook) → Agent replies → Zoho Desk API → HelloSend → WhatsApp
- **Webhook**: `/api/webhooks/zoho-desk` receives ticket.add, ticket.update, IM Message Add events
- **API Client**: `apps/web/src/lib/zoho/desk.ts` for Zoho Desk API operations
- **Sync Functions**: `syncTicketsFromZohoDesk()`, `syncReplyToZohoDesk()`, `runFullSyncFromZohoDesk()`

### Sync API Endpoints
```
/api/zoho/sync/full       # Full bidirectional sync
/api/zoho/sync/clients    # Client sync (from_zoho / to_zoho)
/api/zoho/sync/services   # Service catalog sync
/api/zoho/sync/quotes     # Quote → Estimate sync
/api/zoho/sync/invoices   # Invoice + payment sync
/api/webhooks/zoho-desk   # Zoho Desk webhook (WhatsApp tickets)
```

### UI Components
- `ZohoSyncDashboard` - Full sync status with stats and activity logs
- `SyncButton` - Individual entity sync button

## Development Status

### Completed Tasks
- **Task 01**: Project Setup & Infrastructure
- **Task 02**: Database Schema (Prisma with 17 models)
- **Task 03**: Authentication System (NextAuth.js)
- **Task 04**: Core Dashboard Layout
- **Task 05**: Ticket Management (multi-channel)
- **Task 06**: Client Management (CRUD + Zoho sync)
- **Task 07**: Agent Management (CRUD + roles)
- **Task 08**: Messaging System (threads, attachments)
- **Task 09**: Service Catalog (36+ services from Zoho Books)
- **Task 10**: Quote Builder (line items, status workflow, Zoho Estimates)
- **Task 11**: Invoice System (payments, Zoho Invoices)
- **Task 14**: Email Integration (Microsoft Graph API)

### In Progress
- **Task 12**: Commission System & Agent Billing

### Planned
- **Task 13**: Dashboard Analytics

### Current Phase
**Status**: ~95% Complete
**WhatsApp**: Fully integrated via Zoho Desk + HelloSend
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
├── webhooks/
│   ├── whatsapp           # WhatsApp webhook
│   ├── form               # Form submission webhook
│   ├── chat               # Live chat webhook
│   ├── zoho-desk          # Zoho Desk webhook
│   └── email              # Microsoft Graph email webhook
├── email/
│   ├── accounts           # Email account CRUD
│   ├── callback           # Microsoft OAuth callback
│   ├── inbox              # Unified inbox API
│   ├── send               # Send email (reply, quote, invoice)
│   └── templates          # Email template CRUD
├── whatsapp/*             # WhatsApp send, templates
├── zoho/
│   ├── callback           # OAuth callback
│   ├── status             # Integration status
│   └── sync/              # Sync endpoints (full, clients, services, quotes, invoices)
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
- **Components**: Organized by domain (tickets, clients, agents, messages, quotes, invoices, zoho, email)
- **State**: Zustand stores for client state, React Query for server state
- **API**: RESTful endpoints following `/api/[resource]` pattern
- **Types**: Shared TypeScript definitions in packages/shared
- **Styling**: TailwindCSS utility classes with custom colors (slate-800, slate-900, amber-500)

## Key Files Reference
- **Prisma Schema**: `packages/database/prisma/schema.prisma`
- **Auth Config**: `apps/web/src/lib/auth.ts`
- **Zoho Integration**: `apps/web/src/lib/zoho/` (config, auth, books, crm, desk, sync)
- **Zoho Desk Client**: `apps/web/src/lib/zoho/desk.ts`
- **Zoho Desk Webhook**: `apps/web/src/app/api/webhooks/zoho-desk/route.ts`
- **Zoho Components**: `apps/web/src/components/zoho/`
- **Email Integration**: `apps/web/src/lib/email/` (microsoft-graph, email-processor, email-sender)
- **Email Components**: `apps/web/src/components/email/`
- **Integration Design**: `docs/INTEGRATION_DESIGN.md`
- **Email Integration Design**: `docs/EMAIL_INTEGRATION_ANALYSIS.md`
- **WhatsApp Send Route**: `apps/web/src/app/api/whatsapp/send/route.ts`
- **Main Layout**: `apps/web/src/components/layout/dashboard-layout.tsx`

## Environment Variables
See `.env.example` for required configuration:
- Database connection (DATABASE_URL - PostgreSQL)
- NextAuth secrets (NEXTAUTH_SECRET, NEXTAUTH_URL)
- Zoho integration (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORGANIZATION_ID, ZOHO_REGION)
- Zoho Desk (ZOHO_DESK_ORG_ID, ZOHO_DESK_WEBHOOK_SECRET)
- Microsoft Graph (MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET)
- WhatsApp Business API credentials (fallback)
- Webhook API key

## Implemented Features
- Multi-channel ticket management (WhatsApp, Email, Form, Chat)
- Real-time messaging with file attachments
- Client and agent management with CRUD operations
- Service catalog with 36+ services synced from Zoho Books
- Quote builder with line items and Zoho Estimate sync
- Invoice generation with Zoho Invoice sync and payment tracking
- Overdue invoice detection
- Agent role-based permissions (ADMIN, SENIOR_AGENT, AGENT)
- Full Zoho Books/CRM bidirectional sync with audit logging
- Sync dashboard with status tracking and activity logs
- Client-facing ticket portal
- Dashboard overview statistics
- **WhatsApp Integration** (via Zoho Desk + HelloSend):
  - Webhook receives tickets and messages from Zoho Desk
  - Two-way sync: incoming messages create tickets, agent replies sent via API
  - Automatic client creation from WhatsApp contacts
  - Message threading with Zoho Desk threads
  - Fallback to direct WhatsApp Business API if Desk unavailable
- **Email Integration**:
  - Microsoft Graph API OAuth2 authentication
  - Multi-account inbox (info@, support@, sales@)
  - Automatic ticket creation from incoming emails
  - Smart client lookup (local DB → Zoho CRM → Zoho Books)
  - Email thread detection via Message-ID headers
  - Reply via email from ticket view
  - Send quotes/invoices via email
  - Email templates system
  - Client context panel (quotes, invoices, history)
