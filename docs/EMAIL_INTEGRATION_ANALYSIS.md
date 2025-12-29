# Email Integration System Analysis

## Executive Summary

This document provides a comprehensive analysis for integrating email channels into the Easy Services helpdesk system. The integration will support three email addresses:
- **info@easynotary.co.za** - General inquiries
- **support@easyservicesgroup.co.za** - Support requests
- **sales@easyservicesgroup.co.za** - Sales and quotes

## Current System Architecture

### Existing Channel Infrastructure
The helpdesk already supports multiple channels via a webhook-based architecture:
- **WhatsApp** - Full bidirectional messaging
- **Form** - Website contact form submissions
- **Chat** - Live chat widget
- **EMAIL** - Defined in schema but not implemented

The `TicketChannel.EMAIL` enum already exists, and the UI components have email styling ready.

### Message Flow Pattern
```
Incoming Message → Webhook Handler → Client Lookup/Create → Ticket Routing → Message Storage
```

This pattern will be extended for email integration.

---

## Recommended Integration Approach

### Option A: Microsoft Graph API (Recommended)

**Why Microsoft Graph:**
- Your `.env.example` already has `OUTLOOK_CLIENT_ID` placeholders
- South African businesses commonly use Microsoft 365
- Real-time push notifications via webhooks (no polling)
- Full attachment support with OneDrive integration
- OAuth2 with refresh tokens (reliable long-term access)

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Microsoft 365 Tenant                         │
│  ┌──────────────┬──────────────┬──────────────┐                │
│  │ info@        │ support@     │ sales@       │                │
│  │ easynotary   │ easyservices │ easyservices │                │
│  └──────┬───────┴──────┬───────┴──────┬───────┘                │
│         │              │              │                         │
│         └──────────────┼──────────────┘                         │
│                        │                                        │
│              Microsoft Graph API                                │
│         (Subscription Webhooks + Mail API)                      │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    Helpdesk Application                        │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              /api/webhooks/email                         │  │
│  │  • Receives Graph webhook notifications                  │  │
│  │  • Validates webhook signature                           │  │
│  │  • Fetches full email content via Graph API              │  │
│  │  • Extracts sender, subject, body, attachments           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                         │                                      │
│                         ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Email Processing Service                    │  │
│  │  • Client lookup by email address                        │  │
│  │  • Check Zoho CRM for existing contact                   │  │
│  │  • Thread detection (In-Reply-To header)                 │  │
│  │  • Ticket creation or message append                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                         │                                      │
│                         ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Database Operations                         │  │
│  │  • Create/update Client record                           │  │
│  │  • Create Ticket (channel: EMAIL)                        │  │
│  │  • Create Message with email metadata                    │  │
│  │  • Store attachments (S3/local storage)                  │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Option B: IMAP/SMTP Direct

**Pros:**
- Works with any email provider
- No vendor lock-in
- Lower complexity for basic use cases

**Cons:**
- Requires polling (not real-time)
- More complex attachment handling
- Connection management challenges
- Less reliable for production

**Recommendation:** Use Microsoft Graph API for the primary integration. IMAP can be a fallback for non-Microsoft providers.

---

## Detailed Feature Specifications

### 1. Email Inbox View

**Functionality:**
- Unified inbox showing emails from all three addresses
- Filter by email address (info@, support@, sales@)
- Sort by date, unread status, client
- Preview pane with full email content
- Attachment list with download/preview

**UI Components:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Email Inbox                                          [Refresh]  │
├─────────────────────────────────────────────────────────────────┤
│ Filter: [All Addresses ▼] [Unread Only ☐] [Date Range ...]     │
├─────────────────────────────────────────────────────────────────┤
│ ● sales@... │ John Smith        │ Quote Request - N...│ 2m ago │
│   info@...  │ Maria Garcia      │ Business Hours Q... │ 15m    │
│   support@  │ ABC Company       │ RE: Invoice #1234   │ 1h     │
│   support@  │ Unknown Sender    │ New Inquiry         │ 2h     │
├─────────────────────────────────────────────────────────────────┤
│                     Email Preview Pane                          │
│ From: john@example.com                                          │
│ To: sales@easyservicesgroup.co.za                              │
│ Subject: Quote Request - Notary Services                        │
│ ───────────────────────────────────────────────────────────── │
│ Hi,                                                             │
│                                                                 │
│ I need a quote for notarizing 5 documents...                   │
│                                                                 │
│ Attachments: [📎 document1.pdf] [📎 id_copy.jpg]               │
│                                                                 │
│ [Convert to Ticket] [Reply] [Archive] [Link to Client]         │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Email to Ticket Conversion

**Automatic Conversion Rules:**
- New email from unknown sender → Create ticket + client
- New email from existing client with open ticket → Append to ticket
- New email from existing client, no open ticket → Create new ticket
- Reply (In-Reply-To header matches) → Append to existing thread

**Manual Override:**
- Agent can manually create ticket from any email
- Agent can merge emails into existing tickets
- Agent can split threads into separate tickets

**Conversion Dialog:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Convert Email to Ticket                                    [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Subject: Quote Request - Notary Services                        │
│ From: john@example.com                                          │
│                                                                 │
│ ─── Client Matching ───────────────────────────────────────── │
│                                                                 │
│ ○ Create New Client                                             │
│   Name: [John Smith_________]                                   │
│   Email: john@example.com (from email)                          │
│   Phone: [_______________]                                      │
│                                                                 │
│ ● Match Existing Client                                         │
│   [🔍 Search] Found: John Smith (ABC Company)                  │
│   ✓ Email matches: john@example.com                            │
│   ✓ Found in Zoho CRM: Contact #12345                          │
│                                                                 │
│ ─── Ticket Details ────────────────────────────────────────── │
│                                                                 │
│ Priority: [Medium ▼]                                            │
│ Assign to: [Unassigned ▼]                                       │
│ Source Address: sales@easyservicesgroup.co.za                   │
│                                                                 │
│ ─── Related Records ───────────────────────────────────────── │
│                                                                 │
│ This client has:                                                │
│ • 2 Open Tickets (view)                                         │
│ • 3 Pending Quotes ($4,500 total)                              │
│ • 1 Unpaid Invoice ($1,200 - 15 days overdue)                  │
│                                                                 │
│                              [Cancel] [Create Ticket]           │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Email Reply from Helpdesk

**Reply Composition:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Reply to Email                                             [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ From: [sales@easyservicesgroup.co.za ▼]                        │
│       ○ info@easynotary.co.za                                  │
│       ○ support@easyservicesgroup.co.za                        │
│       ● sales@easyservicesgroup.co.za                          │
│                                                                 │
│ To: john@example.com                                            │
│ CC: [___________________________________] [+ Add]               │
│                                                                 │
│ Subject: RE: Quote Request - Notary Services                    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Hi John,                                                    ││
│ │                                                             ││
│ │ Thank you for your inquiry. Please find attached our       ││
│ │ quote for the notarization services.                        ││
│ │                                                             ││
│ │ [Insert Quote Summary]  [Insert Signature]                 ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Attachments: [+ Add File] [📎 Quote_Q-2024-001.pdf]            │
│                                                                 │
│ Quick Actions:                                                  │
│ [📋 Attach Quote] [📄 Attach Invoice] [📝 Use Template]        │
│                                                                 │
│                              [Save Draft] [Send Email]          │
└─────────────────────────────────────────────────────────────────┘
```

**Smart Reply Features:**
- Auto-select "From" address based on original email destination
- Insert quote/invoice PDF attachments with one click
- Email templates for common responses
- Signature management per email address
- CC/BCC support

### 4. Client Lookup & CRM Integration

**When Processing Incoming Email:**

```typescript
async function processIncomingEmail(email: IncomingEmail) {
  // Step 1: Check local database
  let client = await prisma.client.findUnique({
    where: { email: email.from }
  });

  // Step 2: Check Zoho CRM if not found locally
  if (!client) {
    const zohoContact = await zohoClient.searchContacts({
      email: email.from
    });

    if (zohoContact) {
      // Create local client from Zoho contact
      client = await prisma.client.create({
        data: {
          name: zohoContact.Full_Name,
          email: zohoContact.Email,
          phone: zohoContact.Phone,
          company: zohoContact.Account_Name,
          zohoContactId: zohoContact.id,
          syncStatus: 'SYNCED'
        }
      });
    }
  }

  // Step 3: Check Zoho Books if still not found
  if (!client) {
    const zohoCustomer = await zohoBooks.searchContacts({
      email: email.from
    });

    if (zohoCustomer) {
      client = await prisma.client.create({
        data: {
          name: zohoCustomer.contact_name,
          email: zohoCustomer.email,
          zohoContactId: zohoCustomer.contact_id,
          syncStatus: 'SYNCED'
        }
      });
    }
  }

  // Step 4: Create new client if still not found
  if (!client) {
    client = await createNewClient(email);
  }

  return client;
}
```

**Client Context Panel:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 John Smith                                    [View Profile] │
│    ABC Company                                                  │
│    john@example.com | +27 82 123 4567                          │
├─────────────────────────────────────────────────────────────────┤
│ 📊 Quick Stats                                                  │
│ ─────────────────────────────────────────────────────────────  │
│ Tickets: 5 total (2 open, 3 resolved)                          │
│ Quotes: 8 total ($12,450) - 3 pending                          │
│ Invoices: 6 total ($8,200) - 1 overdue ($1,200)               │
│ Last Contact: 2 days ago via WhatsApp                          │
├─────────────────────────────────────────────────────────────────┤
│ 📋 Active Quotes                                    [View All]  │
│ • Q-2024-089 - Notary Services ($850) - SENT                   │
│ • Q-2024-091 - Document Translation ($1,200) - PENDING         │
├─────────────────────────────────────────────────────────────────┤
│ 💰 Outstanding Invoices                             [View All]  │
│ • INV-2024-156 - $1,200 - 15 DAYS OVERDUE ⚠️                   │
├─────────────────────────────────────────────────────────────────┤
│ 🎫 Open Tickets                                     [View All]  │
│ • #1234 - Document certification query (WhatsApp)              │
│ • #1238 - Invoice payment question (Email)                     │
├─────────────────────────────────────────────────────────────────┤
│ 🔗 Zoho Integration                                             │
│ ✓ Zoho CRM: Contact #CON-12345                                 │
│ ✓ Zoho Books: Customer #CUST-67890                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Quote & Invoice Email Actions

**Send Quote via Email:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Send Quote Q-2024-089                                      [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ From: [sales@easyservicesgroup.co.za ▼]                        │
│ To: john@example.com                                            │
│                                                                 │
│ Subject: Quote Q-2024-089 from Easy Services Group              │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Dear John,                                                  ││
│ │                                                             ││
│ │ Please find attached our quote for the requested services: ││
│ │                                                             ││
│ │ • Notarization - Standard Document × 3 = R450.00           ││
│ │ • Notarization - Affidavit × 2 = R400.00                   ││
│ │                                                             ││
│ │ Total: R850.00 (excl. VAT)                                 ││
│ │                                                             ││
│ │ This quote is valid for 30 days.                           ││
│ │                                                             ││
│ │ [View Full Quote Online]                                   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ Attachments: [📎 Quote_Q-2024-089.pdf]                         │
│                                                                 │
│ ☑ Update quote status to SENT                                  │
│ ☑ Log email in ticket #1234                                    │
│ ☑ Sync to Zoho Books Estimate                                  │
│                                                                 │
│                                        [Preview] [Send Quote]   │
└─────────────────────────────────────────────────────────────────┘
```

**Invoice Payment Reminder:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Send Payment Reminder                                      [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Invoice: INV-2024-156                                           │
│ Amount: R1,200.00                                               │
│ Status: 15 DAYS OVERDUE                                         │
│                                                                 │
│ Template: [First Reminder ▼]                                    │
│           ○ First Reminder (Friendly)                          │
│           ○ Second Reminder (Firm)                             │
│           ○ Final Notice (Urgent)                              │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Dear John,                                                  ││
│ │                                                             ││
│ │ We hope this message finds you well. This is a friendly    ││
│ │ reminder that invoice INV-2024-156 for R1,200.00 was due   ││
│ │ on 14 December 2024.                                        ││
│ │                                                             ││
│ │ If payment has already been made, please disregard this    ││
│ │ reminder.                                                   ││
│ │                                                             ││
│ │ [Pay Online]                                               ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│                                      [Preview] [Send Reminder]  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Email Threading & Conversation View

**Thread Detection Logic:**
```typescript
async function findEmailThread(email: IncomingEmail): Promise<Ticket | null> {
  // Method 1: Check In-Reply-To header
  if (email.headers.inReplyTo) {
    const parentMessage = await prisma.message.findFirst({
      where: { emailMessageId: email.headers.inReplyTo },
      include: { ticket: true }
    });
    if (parentMessage) return parentMessage.ticket;
  }

  // Method 2: Check References header
  if (email.headers.references) {
    const messageIds = email.headers.references.split(/\s+/);
    for (const messageId of messageIds) {
      const message = await prisma.message.findFirst({
        where: { emailMessageId: messageId },
        include: { ticket: true }
      });
      if (message) return message.ticket;
    }
  }

  // Method 3: Subject line matching (RE: or FW: prefix)
  const cleanSubject = email.subject
    .replace(/^(RE:|FW:|FWD:)\s*/gi, '')
    .trim();

  const ticket = await prisma.ticket.findFirst({
    where: {
      subject: cleanSubject,
      channel: 'EMAIL',
      client: { email: email.from },
      status: { in: ['OPEN', 'PENDING'] }
    }
  });

  return ticket;
}
```

**Conversation View (Mixed Channels):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Ticket #1234 - Document Certification Query                     │
│ Client: John Smith | Status: OPEN | Priority: MEDIUM           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [📧 Email] Dec 28, 10:30 AM - john@example.com                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Hi, I need to get some documents certified. What's the      ││
│ │ process?                                                    ││
│ │ 📎 documents.zip (2.4 MB)                                   ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│                    [📧 Email] Dec 28, 11:15 AM - Agent Sarah   │
│                    ┌─────────────────────────────────────────┐ │
│                    │ Hi John, I'd be happy to help. For      │ │
│                    │ document certification, we need...       │ │
│                    │ 📎 Price_List.pdf                        │ │
│                    └─────────────────────────────────────────┘ │
│                                                                 │
│ [📱 WhatsApp] Dec 28, 2:00 PM - +27 82 123 4567               │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Thanks for the info! Can I drop by tomorrow?                ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│                    [📱 WhatsApp] Dec 28, 2:05 PM - Agent Sarah │
│                    ┌─────────────────────────────────────────┐ │
│                    │ Yes, our office hours are 8am-5pm.      │ │
│                    └─────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Reply via: [📧 Email ▼] [📱 WhatsApp]                          │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Type your reply...                                          ││
│ └─────────────────────────────────────────────────────────────┘│
│ [📎 Attach] [📋 Quote] [📄 Invoice]              [Send Reply]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Fields for Message Model

```prisma
model Message {
  id                String         @id @default(cuid())
  ticketId          String
  ticket            Ticket         @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  senderType        SenderType
  senderId          String?
  content           String         @db.Text
  timestamp         DateTime       @default(now())
  read              Boolean        @default(false)

  // WhatsApp fields (existing)
  whatsappMessageId String?
  whatsappStatus    MessageStatus?
  mediaUrl          String?
  mediaType         String?

  // NEW: Email-specific fields
  emailMessageId    String?        @unique  // Message-ID header
  emailSubject      String?                  // Original subject
  emailFrom         String?                  // Sender address
  emailTo           String[]       @default([])  // Recipients
  emailCc           String[]       @default([])  // CC recipients
  emailInReplyTo    String?                  // In-Reply-To header
  emailReferences   String[]       @default([])  // References header
  emailHtmlBody     String?        @db.Text  // Original HTML content
  emailHeaders      Json?                    // Additional headers

  // Attachments (generalized)
  attachments       Attachment[]

  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  @@index([ticketId])
  @@index([emailMessageId])
  @@index([emailInReplyTo])
}

model Attachment {
  id          String   @id @default(cuid())
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  filename    String
  mimeType    String
  size        Int
  storageUrl  String   // S3 or local storage URL

  createdAt   DateTime @default(now())

  @@index([messageId])
}
```

### New EmailAccount Model

```prisma
model EmailAccount {
  id            String   @id @default(cuid())
  email         String   @unique
  displayName   String   // e.g., "Easy Services Support"
  provider      EmailProvider
  isActive      Boolean  @default(true)

  // Microsoft Graph OAuth
  accessToken   String?  @db.Text
  refreshToken  String?  @db.Text
  tokenExpiry   DateTime?

  // IMAP/SMTP settings (fallback)
  imapHost      String?
  imapPort      Int?
  smtpHost      String?
  smtpPort      Int?

  // Webhook subscription
  subscriptionId    String?
  subscriptionExpiry DateTime?

  // Signature
  signature     String?  @db.Text

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum EmailProvider {
  MICROSOFT_365
  GOOGLE_WORKSPACE
  IMAP_SMTP
}
```

### Extended Ticket Model

```prisma
model Ticket {
  // ... existing fields ...

  // NEW: Email source tracking
  emailAccountId    String?        // Which inbox received this
  emailAccount      EmailAccount?  @relation(fields: [emailAccountId], references: [id])
}
```

---

## API Endpoints Design

### Email Webhook Endpoints

```
POST /api/webhooks/email/microsoft
  - Receives Microsoft Graph change notifications
  - Validates subscription
  - Fetches email content
  - Creates/updates tickets

POST /api/webhooks/email/microsoft/lifecycle
  - Handles subscription lifecycle events
  - Renews subscriptions before expiry
```

### Email Management Endpoints

```
GET /api/email/accounts
  - List configured email accounts
  - Returns sync status, message counts

POST /api/email/accounts
  - Add new email account
  - Initiates OAuth flow

DELETE /api/email/accounts/:id
  - Remove email account

POST /api/email/accounts/:id/sync
  - Manual sync trigger
  - Fetches recent emails

GET /api/email/inbox
  - Unified inbox view
  - Filters: account, unread, date range
  - Pagination support

GET /api/email/inbox/:messageId
  - Full email content
  - Attachments list
  - Thread context
```

### Email Sending Endpoints

```
POST /api/email/send
  - Send email from helpdesk
  - Body: { from, to, cc, subject, body, attachments, ticketId }

POST /api/email/reply/:ticketId
  - Reply to ticket via email
  - Auto-selects from address

POST /api/quotes/:id/send-email
  - Send quote via email
  - Updates quote status

POST /api/invoices/:id/send-email
  - Send invoice via email
  - Optional: payment reminder template
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Database schema updates
2. Microsoft Graph OAuth setup
3. Basic webhook receiver
4. Email account management UI

### Phase 2: Incoming Emails (Week 2-3)
1. Email to ticket conversion
2. Client lookup/matching
3. Thread detection
4. Attachment handling
5. Email inbox UI

### Phase 3: Outgoing Emails (Week 3-4)
1. Reply functionality
2. From address selection
3. Email templates
4. Quote/Invoice email sending
5. Signature management

### Phase 4: Advanced Features (Week 4-5)
1. Cross-channel conversation view
2. Client context panel
3. Zoho CRM lookup integration
4. Email analytics
5. Auto-assignment rules

### Phase 5: Polish & Optimization (Week 5-6)
1. Email signature stripping
2. HTML to Markdown conversion
3. Large attachment handling
4. Rate limiting
5. Error handling & retries

---

## Security Considerations

### OAuth Token Security
- Store tokens encrypted in database
- Use refresh tokens (never store passwords)
- Implement token rotation
- Monitor for token expiry

### Webhook Validation
- Validate Microsoft Graph webhook signatures
- Use webhook secret for verification
- Rate limit incoming webhooks
- Log all webhook events

### Email Content Security
- Sanitize HTML content (XSS prevention)
- Scan attachments for malware (optional)
- Block executable attachments
- Size limits on attachments

### Access Control
- Only authenticated agents can read emails
- Audit log for email access
- Role-based access to email accounts

---

## Environment Variables Required

```env
# Microsoft Graph API
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# Email Accounts (auto-configured via OAuth)
# Stored in database after OAuth flow

# Webhook
EMAIL_WEBHOOK_SECRET=random-secret-for-validation
NEXTAUTH_URL=https://your-domain.com  # For OAuth callback

# Storage (for attachments)
S3_BUCKET_NAME=helpdesk-attachments
S3_REGION=af-south-1
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx

# Or local storage
ATTACHMENT_STORAGE_PATH=/var/attachments
```

---

## Summary of Functionality

| Feature | Description |
|---------|-------------|
| **Multi-Inbox Support** | 3 email addresses managed in one dashboard |
| **Real-time Sync** | Microsoft Graph webhooks for instant notifications |
| **Auto-Ticket Creation** | Incoming emails automatically become tickets |
| **Smart Threading** | Email conversations grouped intelligently |
| **Client Matching** | Auto-lookup in local DB, Zoho CRM, Zoho Books |
| **Reply from Helpdesk** | Send emails directly from ticket view |
| **Address Selection** | Choose which email address to reply from |
| **Quote/Invoice Emails** | One-click send documents to clients |
| **Attachment Handling** | Upload, download, and attach files |
| **Cross-Channel View** | See email + WhatsApp in same conversation |
| **Client Context** | View quotes, invoices, history when handling email |
| **Email Templates** | Pre-built responses for common scenarios |
| **Signature Management** | Per-account email signatures |

---

## Next Steps

1. **Confirm approach**: Microsoft Graph vs IMAP/SMTP
2. **Set up Microsoft 365 App Registration** in Azure portal
3. **Implement Phase 1** database schema and OAuth
4. **Test with one email account** before adding all three
5. **Iterate based on feedback**

Would you like me to proceed with implementation?
