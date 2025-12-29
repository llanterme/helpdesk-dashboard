# Easy Services Group - Systems Integration Design

## Executive Summary

This document outlines the integration architecture between the Helpdesk Dashboard and Zoho ecosystem (Books + CRM) to create a unified workflow for client management, quote generation, and invoicing.

---

## Current State Analysis

### Systems Inventory

| System | Purpose | Data Owned |
|--------|---------|------------|
| **Helpdesk Dashboard** | Ticket management, messaging, internal workflows | Tickets, Messages, Agents, Bills |
| **Zoho CRM** | Lead/Contact management, Sales pipeline, Deals | Contacts, Deals, Pipeline stages |
| **Zoho Books** | Accounting, Invoicing, Items catalog | Items, Contacts, Estimates, Invoices, Payments |

### Current Data Relationships

```
Zoho CRM                    Zoho Books                  Helpdesk
─────────────────────────────────────────────────────────────────
Contacts ←──linked──→ Contacts ←──sync──→ Clients
   ↓                     ↓                    ↓
Deals                 Estimates ←──sync──→ Quotes
   ↓                     ↓                    ↓
(Pipeline)            Invoices ←──sync──→ Invoices
                         ↓                    ↓
                      Payments              Bills (Commission)
```

### Existing Zoho Link (CRM ↔ Books)

**Important Discovery:** Zoho CRM and Books contacts are already linked:
- `is_linked_with_zohocrm: true` on Books contacts
- Source shows `zoho_crm` for synced contacts
- This means CRM is the **master** for contact data

---

## Proposed Integration Architecture

### Design Principles

1. **Zoho as Source of Truth** for external data (clients, services, pricing)
2. **Helpdesk as Source of Truth** for internal data (tickets, messages, agents, commissions)
3. **Bidirectional sync** with conflict resolution favoring Zoho
4. **Event-driven updates** where possible (webhooks)
5. **Graceful degradation** - helpdesk works offline from Zoho

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ZOHO ECOSYSTEM                                │
│  ┌─────────────┐         ┌─────────────┐                            │
│  │  Zoho CRM   │◄───────►│ Zoho Books  │                            │
│  │             │  native │             │                            │
│  │ • Contacts  │  sync   │ • Contacts  │                            │
│  │ • Deals     │         │ • Items     │                            │
│  │ • Pipeline  │         │ • Estimates │                            │
│  └──────┬──────┘         │ • Invoices  │                            │
│         │                │ • Payments  │                            │
│         │                └──────┬──────┘                            │
└─────────┼───────────────────────┼───────────────────────────────────┘
          │                       │
          │    REST API + OAuth   │
          │                       │
┌─────────┼───────────────────────┼───────────────────────────────────┐
│         ▼                       ▼                                    │
│  ┌──────────────────────────────────────┐                           │
│  │         SYNC SERVICE LAYER           │                           │
│  │  • Token Management (Redis cache)    │                           │
│  │  • Rate Limiting (Zoho: 100/min)     │                           │
│  │  • Conflict Resolution               │                           │
│  │  • Error Handling & Retry            │                           │
│  └──────────────────────────────────────┘                           │
│                      │                                               │
│                      ▼                                               │
│  ┌──────────────────────────────────────┐                           │
│  │         HELPDESK DATABASE            │                           │
│  │  • Clients (with Zoho IDs)           │                           │
│  │  • Services (with Zoho IDs)          │                           │
│  │  • Quotes (with Zoho IDs)            │                           │
│  │  • Invoices (with Zoho IDs)          │                           │
│  │  • Tickets (helpdesk only)           │                           │
│  │  • Messages (helpdesk only)          │                           │
│  │  • Agents (helpdesk only)            │                           │
│  │  • Bills (helpdesk only)             │                           │
│  └──────────────────────────────────────┘                           │
│                                                                      │
│                    HELPDESK DASHBOARD                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Integration Workflows

### 1. Client Data Sync

**Direction:** Zoho CRM → Zoho Books → Helpdesk (Pull)
**Trigger:** Scheduled job (every 15 min) + Manual refresh

```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT SYNC WORKFLOW                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Fetch Zoho Books Contacts (paginated)                    │
│     GET /books/v3/contacts?contact_type=customer             │
│                                                               │
│  2. For each contact:                                        │
│     ├─ Match by zohoBooksContactId (existing)                │
│     ├─ Or match by email (new link)                          │
│     └─ Or create new Client                                  │
│                                                               │
│  3. Update local Client:                                     │
│     ├─ name = contact_name                                   │
│     ├─ email = email                                         │
│     ├─ phone = phone || mobile                               │
│     ├─ company = company_name                                │
│     ├─ zohoBooksContactId = contact_id                       │
│     └─ zohoSyncedAt = now()                                  │
│                                                               │
│  4. Extract CRM Contact ID (if linked):                      │
│     └─ zohoCrmContactId from CRM link                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Reverse Sync (Helpdesk → Zoho):**
- Only for clients created in Helpdesk first
- Creates in CRM first (master), then Books syncs automatically

### 2. Service Catalog Sync

**Direction:** Zoho Books → Helpdesk (Pull only)
**Trigger:** Scheduled job (daily) + Manual refresh

```
┌──────────────────────────────────────────────────────────────┐
│                   SERVICE SYNC WORKFLOW                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Fetch Zoho Books Items (active only)                     │
│     GET /books/v3/items?status=active                        │
│                                                               │
│  2. Map Zoho Item → Service:                                 │
│     ├─ name = item_name                                      │
│     ├─ description = description                             │
│     ├─ rate = rate                                           │
│     ├─ unit = unit || 'Each'                                 │
│     ├─ sku = sku                                             │
│     ├─ category = group_name || 'General'                    │
│     ├─ active = (status === 'active')                        │
│     └─ zohoBooksItemId = item_id                             │
│                                                               │
│  3. Match strategy:                                          │
│     ├─ By zohoBooksItemId (existing link)                    │
│     ├─ Or by SKU (fallback match)                            │
│     └─ Or create new Service                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Categories from Zoho Books Items:**
- DHA Services (Certificates, Registrations)
- DIRCO Services (Apostille, Authentication)
- SAPS Services (Police Clearance)
- High Court Services (Notary)
- Courier Services (Local, International)
- Other (Embassy, SAQA, HPCSA, etc.)

### 3. Quote → Estimate Workflow

**Direction:** Helpdesk → Zoho Books (Push)
**Trigger:** On quote status change or manual sync

```
┌──────────────────────────────────────────────────────────────┐
│                  QUOTE → ESTIMATE WORKFLOW                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  PREREQUISITES:                                               │
│  ├─ Client must have zohoBooksContactId                      │
│  └─ All services must have zohoBooksItemId                   │
│                                                               │
│  CREATE ESTIMATE:                                            │
│  POST /books/v3/estimates                                    │
│  {                                                           │
│    "customer_id": client.zohoBooksContactId,                 │
│    "line_items": [                                           │
│      {                                                       │
│        "item_id": service.zohoBooksItemId,                   │
│        "name": service.name,                                 │
│        "description": quoteItem.customDescription,           │
│        "rate": quoteItem.rate,                               │
│        "quantity": quoteItem.quantity                        │
│      }                                                       │
│    ],                                                        │
│    "discount": quote.discountAmount,                         │
│    "notes": quote.notes,                                     │
│    "terms": quote.terms,                                     │
│    "expiry_date": quote.validUntil                           │
│  }                                                           │
│                                                               │
│  STATUS MAPPING:                                             │
│  ├─ DRAFT     → (no action)                                  │
│  ├─ SENT      → POST /estimates/{id}/status/sent             │
│  ├─ ACCEPTED  → POST /estimates/{id}/status/accepted         │
│  ├─ REJECTED  → POST /estimates/{id}/status/declined         │
│  └─ EXPIRED   → (handled by Zoho automatically)              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4. Invoice Generation Workflow

**Direction:** Helpdesk → Zoho Books (Push)
**Trigger:** Quote accepted or direct invoice creation

```
┌──────────────────────────────────────────────────────────────┐
│                  INVOICE WORKFLOW                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  SCENARIO A: Convert from Quote (has Estimate)               │
│  ────────────────────────────────────────────                │
│  POST /books/v3/invoices/fromestimate                        │
│  ?estimate_id={quote.zohoBooksEstimateId}                    │
│                                                               │
│  SCENARIO B: Direct Invoice (no Estimate)                    │
│  ─────────────────────────────────────────                   │
│  POST /books/v3/invoices                                     │
│  {                                                           │
│    "customer_id": client.zohoBooksContactId,                 │
│    "line_items": [...],                                      │
│    "due_date": invoice.dueDate,                              │
│    "notes": invoice.notes,                                   │
│    "terms": invoice.terms                                    │
│  }                                                           │
│                                                               │
│  STATUS SYNC:                                                │
│  ├─ SENT → POST /invoices/{id}/status/sent                   │
│  ├─ PAID → POST /customerpayments (record payment)           │
│  └─ VOID → POST /invoices/{id}/status/void                   │
│                                                               │
│  PAYMENT RECORDING:                                          │
│  POST /books/v3/customerpayments                             │
│  {                                                           │
│    "customer_id": client.zohoBooksContactId,                 │
│    "payment_mode": "bank_transfer",                          │
│    "amount": invoice.totalAmount,                            │
│    "date": invoice.paidDate,                                 │
│    "invoices": [{                                            │
│      "invoice_id": invoice.zohoBooksInvoiceId,               │
│      "amount_applied": invoice.totalAmount                   │
│    }]                                                        │
│  }                                                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5. CRM Deal Integration (Future)

**Direction:** Bidirectional
**Purpose:** Track sales pipeline in CRM, link to quotes

```
┌──────────────────────────────────────────────────────────────┐
│                  CRM DEAL WORKFLOW                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Current Zoho CRM Deal Stages (observed):                    │
│  ├─ "Quote Sent"                                             │
│  ├─ (others TBD from pipeline settings)                      │
│  └─ ...                                                      │
│                                                               │
│  FUTURE: Create Deal from Quote                              │
│  POST /crm/v6/Deals                                          │
│  {                                                           │
│    "data": [{                                                │
│      "Deal_Name": "{client} - {date}",                       │
│      "Amount": quote.totalAmount,                            │
│      "Stage": "Quote Sent",                                  │
│      "Contact_Name": client.zohoCrmContactId                 │
│    }]                                                        │
│  }                                                           │
│                                                               │
│  STAGE MAPPING:                                              │
│  ├─ Quote DRAFT    → (no deal yet)                           │
│  ├─ Quote SENT     → "Quote Sent"                            │
│  ├─ Quote ACCEPTED → "Closed Won"                            │
│  └─ Quote REJECTED → "Closed Lost"                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema Enhancements

### Proposed Additions

```prisma
model Client {
  // ... existing fields ...

  // Zoho Integration (existing)
  zohoCrmContactId    String?   @unique
  zohoBooksContactId  String?   @unique
  zohoSyncedAt        DateTime?

  // NEW: Sync metadata
  zohoSyncStatus      SyncStatus @default(PENDING)
  zohoSyncError       String?
  zohoLastModified    DateTime?  // Track Zoho's last_modified_time
}

model Quote {
  // ... existing fields ...

  // NEW: CRM Deal link
  zohoCrmDealId       String?   @unique
}

enum SyncStatus {
  PENDING      // Never synced
  SYNCED       // Successfully synced
  FAILED       // Last sync failed
  CONFLICT     // Manual resolution needed
}

// NEW: Sync audit log
model SyncLog {
  id            String    @id @default(cuid())
  entityType    String    // 'client', 'service', 'quote', 'invoice'
  entityId      String
  direction     String    // 'to_zoho', 'from_zoho'
  status        String    // 'success', 'failed', 'skipped'
  zohoId        String?
  errorMessage  String?
  requestBody   Json?
  responseBody  Json?
  createdAt     DateTime  @default(now())
}
```

---

## API Endpoint Design

### New Zoho Sync Endpoints

```
POST /api/zoho/sync/full
  - Runs complete sync cycle
  - Returns: { clients, services, quotes, invoices, errors }

GET /api/zoho/sync/status
  - Returns sync health and last run times

POST /api/zoho/sync/clients
  - Sync all/specific clients
  - Body: { clientId?: string, direction: 'from_zoho' | 'to_zoho' }

POST /api/zoho/sync/services
  - Pull services from Zoho Books
  - Body: { } (always from Zoho)

POST /api/zoho/webhooks/books
  - Webhook receiver for Zoho Books events
  - Handles: invoice.created, payment.created, contact.updated

POST /api/zoho/webhooks/crm
  - Webhook receiver for Zoho CRM events
  - Handles: Contacts.create, Contacts.update, Deals.update
```

### Enhanced Quote/Invoice Endpoints

```
POST /api/quotes
  - Create quote
  - NEW: Auto-sync to Zoho if configured

POST /api/quotes/{id}/send
  - Mark as sent + sync to Zoho
  - Creates/updates Estimate in Books
  - Optionally creates Deal in CRM

POST /api/quotes/{id}/accept
  - Accept quote
  - Updates Estimate status in Books
  - Converts to Invoice in Books
  - Creates local Invoice
  - Updates Deal stage in CRM

POST /api/invoices/{id}/mark-paid
  - Record payment locally
  - Syncs payment to Zoho Books
```

---

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Zoho OAuth setup
- [x] Basic API clients (Books + CRM)
- [x] Manual sync endpoints
- [ ] Token caching (Redis)

### Phase 2: Client Sync
- [ ] Pull clients from Zoho Books
- [ ] Match/merge with existing clients
- [ ] UI for viewing sync status
- [ ] Manual sync trigger button

### Phase 3: Service Catalog
- [ ] Pull all items from Zoho Books
- [ ] Map to Service categories
- [ ] Price sync from Zoho
- [ ] UI for service catalog management

### Phase 4: Quote Integration
- [ ] Auto-sync quotes to Estimates
- [ ] Status sync (sent/accepted/rejected)
- [ ] Link to existing Estimates
- [ ] Quote builder uses Zoho services

### Phase 5: Invoice Integration
- [ ] Convert Estimate → Invoice in Zoho
- [ ] Payment recording sync
- [ ] Invoice PDF from Zoho
- [ ] Balance/payment tracking

### Phase 6: CRM Deals (Future)
- [ ] Create Deals from quotes
- [ ] Pipeline stage mapping
- [ ] Activity logging

### Phase 7: Webhooks (Future)
- [ ] Zoho Books webhooks
- [ ] Zoho CRM webhooks
- [ ] Real-time sync

---

## Configuration Required

### Environment Variables
```env
# Current (already configured)
ZOHO_CLIENT_ID=1000.CO6L7ENNUK00W2BXY7HYS10QYSOERA
ZOHO_CLIENT_SECRET=7c55b2907579878f2c8d31eac41adb0f8db8558af4
ZOHO_REFRESH_TOKEN=1000.e9b9ece6e403ca713206f733033894a2.77d3d2af3754130b663e346ff722029f
ZOHO_ORGANIZATION_ID=868945505
ZOHO_REGION=com

# Future: Redis for token caching
REDIS_URL=redis://localhost:6379

# Future: Webhook secrets
ZOHO_BOOKS_WEBHOOK_SECRET=...
ZOHO_CRM_WEBHOOK_SECRET=...
```

### Rate Limits to Handle
- Zoho Books: 100 requests/minute, 10 concurrent
- Zoho CRM: 100 requests/minute (same pool)
- Daily: 15,000 requests/day (Books) + separate CRM quota

---

## Data Mapping Reference

### Client ↔ Zoho Contact
| Helpdesk Client | Zoho Books Contact | Zoho CRM Contact |
|-----------------|-------------------|------------------|
| name | contact_name | Full_Name |
| email | email | Email |
| phone | phone / mobile | Phone / Mobile |
| company | company_name | Account_Name |
| whatsappId | (custom field?) | (custom field?) |

### Service ↔ Zoho Item
| Helpdesk Service | Zoho Books Item |
|------------------|-----------------|
| name | item_name |
| description | description |
| rate | rate |
| unit | unit |
| sku | sku |
| category | group_name |
| active | status = 'active' |

### Quote ↔ Zoho Estimate
| Helpdesk Quote | Zoho Books Estimate |
|----------------|---------------------|
| number | estimate_number |
| clientId | customer_id |
| status | status |
| subtotal | sub_total |
| taxAmount | tax_total |
| discountAmount | discount |
| totalAmount | total |
| notes | notes |
| terms | terms |
| validUntil | expiry_date |
| items[] | line_items[] |

### Invoice ↔ Zoho Invoice
| Helpdesk Invoice | Zoho Books Invoice |
|------------------|-------------------|
| number | invoice_number |
| clientId | customer_id |
| status | status |
| totalAmount | total |
| dueDate | due_date |
| paidDate | (from payment) |
| items[] | line_items[] |

---

## Risk Mitigation

### Data Conflicts
- **Scenario:** Same client edited in both systems
- **Resolution:** Zoho wins (source of truth), log conflict

### Sync Failures
- **Scenario:** Zoho API unavailable
- **Resolution:** Queue for retry, mark as PENDING

### Orphaned Records
- **Scenario:** Quote created locally, sync fails
- **Resolution:** Clear error messaging, manual retry option

### Price Changes
- **Scenario:** Service price changes in Zoho
- **Resolution:** Daily sync updates local prices, existing quotes unchanged

---

## Security Considerations

1. **Token Storage:** Refresh token in env vars (encrypted at rest)
2. **Access Control:** Only admins can trigger manual syncs
3. **Audit Trail:** All sync operations logged
4. **Webhook Validation:** Verify Zoho webhook signatures
5. **Data Encryption:** HTTPS for all API calls (enforced by Zoho)

---

## Monitoring & Alerting

### Metrics to Track
- Sync success/failure rate
- API latency (Books + CRM)
- Token refresh frequency
- Queue depth (pending syncs)

### Alerts
- Token refresh failure
- Sync failure rate > 10%
- API rate limit approaching
- Webhook delivery failures

---

## Next Steps

1. **Immediate:** Implement Phase 2 (Client Sync from Zoho)
2. **This Week:** Add sync status UI to client list
3. **Next Week:** Phase 3 (Service catalog sync)
4. **Following:** Quote/Invoice integration (Phases 4-5)

---

*Document Version: 1.0*
*Last Updated: 2025-12-29*
*Author: Systems Integration Design*
