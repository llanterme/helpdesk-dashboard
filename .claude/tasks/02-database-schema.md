# Task 02: Database Schema & Core Models

## Overview
Setup Prisma schema with all core entities and relationships based on the POC business domains.

## Prerequisites
- Task 01 completed (project setup)
- MySQL database available (Railway or local)

## Technical Requirements

### Core Entities
1. **User** - Authentication and system access
2. **Agent** - Team members with roles and commission rates
3. **Client** - Customer contacts and profiles
4. **Service** - Catalog items with pricing
5. **Ticket** - Support cases with multi-channel support
6. **Message** - Conversation threads within tickets
7. **Quote** - Service estimates with line items
8. **QuoteItem** - Individual services in quotes
9. **Invoice** - Converted quotes for billing
10. **InvoiceItem** - Individual services in invoices
11. **Bill** - Agent commission payments
12. **BillItem** - Commission line items

### Database Schema (`packages/database/prisma/schema.prisma`)

```prisma
// This is your Prisma schema file,
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      UserRole @default(AGENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  agent Agent?

  @@map("users")
}

model Agent {
  id             String      @id @default(cuid())
  userId         String?     @unique
  name           String
  email          String      @unique
  phone          String?
  role           AgentRole   @default(AGENT)
  avatar         String?
  color          String?
  commissionRate Float       @default(50.0)
  status         AgentStatus @default(ACTIVE)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  // Relations
  user     User?     @relation(fields: [userId], references: [id])
  tickets  Ticket[]
  quotes   Quote[]
  invoices Invoice[]
  bills    Bill[]

  @@map("agents")
}

model Client {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  company   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  tickets  Ticket[]
  quotes   Quote[]
  invoices Invoice[]

  @@map("clients")
}

model Service {
  id          String   @id @default(cuid())
  name        String
  category    String
  description String?
  rate        Float
  unit        String   @default("per item")
  sku         String   @unique
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  quoteItems   QuoteItem[]
  invoiceItems InvoiceItem[]

  @@map("services")
}

model Ticket {
  id        String        @id @default(cuid())
  subject   String
  channel   TicketChannel
  status    TicketStatus  @default(OPEN)
  priority  TicketPriority @default(MEDIUM)
  unread    Boolean       @default(true)
  clientId  String
  agentId   String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  // Relations
  client   Client    @relation(fields: [clientId], references: [id])
  agent    Agent?    @relation(fields: [agentId], references: [id])
  messages Message[]

  @@map("tickets")
}

model Message {
  id         String      @id @default(cuid())
  ticketId   String
  senderType SenderType
  senderId   String?
  content    String      @db.Text
  timestamp  DateTime    @default(now())
  read       Boolean     @default(false)

  // Relations
  ticket Ticket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@map("messages")
}

model Quote {
  id          String      @id @default(cuid())
  clientId    String
  agentId     String?
  status      QuoteStatus @default(DRAFT)
  totalAmount Float       @default(0)
  validUntil  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  client     Client      @relation(fields: [clientId], references: [id])
  agent      Agent?      @relation(fields: [agentId], references: [id])
  items      QuoteItem[]
  invoice    Invoice?

  @@map("quotes")
}

model QuoteItem {
  id        String  @id @default(cuid())
  quoteId   String
  serviceId String
  quantity  Int     @default(1)
  rate      Float
  lineTotal Float

  // Relations
  quote   Quote   @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id])

  @@map("quote_items")
}

model Invoice {
  id          String        @id @default(cuid())
  quoteId     String?       @unique
  clientId    String
  agentId     String?
  status      InvoiceStatus @default(PENDING)
  totalAmount Float
  dueDate     DateTime?
  paidDate    DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  quote  Quote?        @relation(fields: [quoteId], references: [id])
  client Client        @relation(fields: [clientId], references: [id])
  agent  Agent?        @relation(fields: [agentId], references: [id])
  items  InvoiceItem[]
  bill   Bill?

  @@map("invoices")
}

model InvoiceItem {
  id        String  @id @default(cuid())
  invoiceId String
  serviceId String
  quantity  Int     @default(1)
  rate      Float
  lineTotal Float

  // Relations
  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id])

  @@map("invoice_items")
}

model Bill {
  id          String     @id @default(cuid())
  invoiceId   String     @unique
  agentId     String
  totalAmount Float
  status      BillStatus @default(DRAFT)
  createdAt   DateTime   @default(now())
  paidDate    DateTime?

  // Relations
  invoice Invoice   @relation(fields: [invoiceId], references: [id])
  agent   Agent     @relation(fields: [agentId], references: [id])
  items   BillItem[]

  @@map("bills")
}

model BillItem {
  id             String @id @default(cuid())
  billId         String
  serviceName    String
  quantity       Int
  commissionRate Float
  lineTotal      Float

  // Relations
  bill Bill @relation(fields: [billId], references: [id], onDelete: Cascade)

  @@map("bill_items")
}

// Enums
enum UserRole {
  ADMIN
  AGENT
}

enum AgentRole {
  ADMIN
  SENIOR_AGENT
  AGENT
}

enum AgentStatus {
  ACTIVE
  INACTIVE
}

enum TicketChannel {
  WHATSAPP
  EMAIL
  FORM
  CHAT
}

enum TicketStatus {
  OPEN
  PENDING
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum SenderType {
  CLIENT
  AGENT
}

enum QuoteStatus {
  DRAFT
  SENT
  PENDING
  ACCEPTED
  EXPIRED
}

enum InvoiceStatus {
  PENDING
  SENT
  PAID
  OVERDUE
}

enum BillStatus {
  DRAFT
  SENT
  PAID
}
```

### Seed Data (`packages/database/prisma/seed.ts`)

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@helpdesk.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    }
  })

  // Create admin agent
  const adminAgent = await prisma.agent.create({
    data: {
      userId: adminUser.id,
      name: 'Admin User',
      email: 'admin@helpdesk.com',
      phone: '+27 11 000 0000',
      role: 'ADMIN',
      avatar: 'AD',
      color: '#f59e0b',
      commissionRate: 0,
    }
  })

  // Create sample agents
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        name: 'Sipho Ndlovu',
        email: 'sipho@helpdesk.com',
        phone: '+27 82 123 4567',
        role: 'SENIOR_AGENT',
        avatar: 'SN',
        color: '#3b82f6',
        commissionRate: 50,
      }
    }),
    prisma.agent.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@helpdesk.com',
        phone: '+27 83 234 5678',
        role: 'AGENT',
        avatar: 'MS',
        color: '#10b981',
        commissionRate: 50,
      }
    })
  ])

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'James Mokoena',
        email: 'james@example.com',
        phone: '+27 82 123 4567',
        company: 'Mokoena Legal',
      }
    }),
    prisma.client.create({
      data: {
        name: 'Sarah Nkosi',
        email: 'sarah.nkosi@gmail.com',
        phone: '+27 83 234 5678',
      }
    })
  ])

  // Create services catalog
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Apostille - DIRCO',
        category: 'Apostille',
        description: 'Document apostille through DIRCO (3-4 weeks)',
        rate: 850,
        unit: 'per document',
        sku: 'APO-DIRCO',
      }
    }),
    prisma.service.create({
      data: {
        name: 'Apostille - High Court',
        category: 'Apostille',
        description: 'Fast-track apostille through High Court (1-2 days)',
        rate: 1200,
        unit: 'per document',
        sku: 'APO-HC',
      }
    }),
    prisma.service.create({
      data: {
        name: 'Notarial Certification',
        category: 'Notary',
        description: 'Certified true copy by Notary Public',
        rate: 350,
        unit: 'per document',
        sku: 'NOT-CERT',
      }
    })
  ])

  console.log('✅ Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

## Implementation Steps

1. **Setup Prisma Configuration**
   ```bash
   cd packages/database
   npx prisma init
   ```

2. **Create Schema File**
   - Replace generated schema with complete business model
   - Verify all relationships and constraints

3. **Configure Environment**
   ```bash
   # In .env.local
   DATABASE_URL="mysql://user:password@localhost:3306/helpdesk"
   ```

4. **Generate Prisma Client**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create and Run Seed Script**
   ```bash
   npx prisma db seed
   ```

## Acceptance Criteria

### ✅ Schema Design
- [ ] All 12 core entities defined with proper types
- [ ] Foreign key relationships correctly established
- [ ] Enums defined for status fields
- [ ] Indexes on frequently queried fields

### ✅ Database Connection
- [ ] Prisma client generates without errors
- [ ] Database migrations apply successfully
- [ ] Connection string works with MySQL

### ✅ Seed Data
- [ ] Admin user and agent created
- [ ] Sample agents, clients, and services populated
- [ ] All relationships properly linked
- [ ] Passwords properly hashed

### ✅ Type Generation
- [ ] TypeScript types generated from schema
- [ ] Types available for import in other packages
- [ ] No compilation errors in generated code

## Testing Instructions

1. **Verify Schema Generation**
   ```bash
   cd packages/database
   npx prisma generate
   # Should complete without errors
   ```

2. **Test Database Connection**
   ```bash
   npx prisma db push
   # Should create all tables successfully
   ```

3. **Run Seed Script**
   ```bash
   npx prisma db seed
   # Should populate initial data
   ```

4. **Verify Data in Database**
   ```bash
   npx prisma studio
   # Opens web interface to browse data
   ```

5. **Test Type Imports**
   ```typescript
   // In any TypeScript file
   import { User, Agent, Ticket } from '@helpdesk/database'
   // Should import without errors
   ```

## Architecture Patterns Established

- **Data Modeling**: Prisma schema-first approach
- **Type Safety**: Generated TypeScript types
- **Relationships**: Foreign keys with cascade deletes
- **Enums**: Controlled vocabulary for status fields
- **Seeding**: Consistent initial data setup

## Files Created
```
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   └── index.ts
└── package.json
```

---
**Next Task**: `03-authentication-system.md` - Setup NextAuth.js with email/password authentication