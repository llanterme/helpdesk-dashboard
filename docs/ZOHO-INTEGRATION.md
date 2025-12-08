# Zoho Integration Guide

This document describes how to set up and use the Zoho Books and Zoho CRM integration with the Easy Services Helpdesk.

## Overview

The helpdesk integrates with:
- **Zoho Books**: Services (Items), Quotes (Estimates), Invoices, and Contacts
- **Zoho CRM**: Contacts

Data flows bidirectionally:
- **From Zoho → Helpdesk**: Services catalog sync from Zoho Books Items
- **From Helpdesk → Zoho**: Clients, Quotes, and Invoices sync to Zoho

## Setup

### 1. Create Zoho API Credentials

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Click "Add Client" → "Server-based Applications"
3. Fill in:
   - **Client Name**: Easy Services Helpdesk
   - **Homepage URL**: https://helpdesk.easyservicesgroup.co.za
   - **Authorized Redirect URIs**: https://helpdesk.easyservicesgroup.co.za/api/zoho/callback
4. Save and note down:
   - **Client ID**
   - **Client Secret**

### 2. Generate Refresh Token

1. Build the authorization URL:
```
https://accounts.zoho.com/oauth/v2/auth?
  scope=ZohoBooks.fullaccess.all,ZohoCRM.modules.ALL,ZohoCRM.settings.ALL
  &client_id=YOUR_CLIENT_ID
  &response_type=code
  &access_type=offline
  &redirect_uri=https://helpdesk.easyservicesgroup.co.za/api/zoho/callback
```

2. Visit this URL and authorize the application
3. You'll receive a `code` parameter in the redirect
4. Exchange for refresh token:

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://helpdesk.easyservicesgroup.co.za/api/zoho/callback" \
  -d "code=YOUR_CODE"
```

5. Save the `refresh_token` from the response

### 3. Get Organization ID

1. Log into Zoho Books
2. Go to Settings → Organization Profile
3. The Organization ID is in the URL or on the page

### 4. Configure Environment Variables

Add to `.env` or `.env.local`:

```env
# Zoho OAuth Credentials
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token

# Zoho Organization
ZOHO_ORGANIZATION_ID=your_org_id

# Region (optional, defaults to 'com')
# Options: com, eu, in, com.au, jp, ca
ZOHO_REGION=com
```

## API Endpoints

### Check Status
```
GET /api/zoho/status
```
Returns configuration status)and connectivity test.

### Sync Services from Zoho Books
```
POST /api/zoho/sync/services
```
Imports all Items from Zoho Books as Services in the helpdesk.

### Sync Clients to Zoho
```
POST /api/zoho/sync/clients
Body: { "clientId": "optional-specific-client" }
```
- If `clientId` provided: syncs that client to both Zoho Books (as Contact) and Zoho CRM
- If no `clientId`: syncs all unsynced clients

### Sync Quote to Zoho
```
POST /api/zoho/sync/quotes
Body: { "quoteId": "quote-id", "statusOnly": false }
```
- Creates/updates an Estimate in Zoho Books
- If `statusOnly: true`, only updates the estimate status

### Sync Invoice to Zoho
```
POST /api/zoho/sync/invoices
Body: { "invoiceId": "invoice-id", "statusOnly": false }
```
- Creates/updates an Invoice in Zoho Books
- If quote was synced, converts the Zoho estimate to invoice
- If `statusOnly: true`, only updates the invoice status (sent/paid)

## Data Mapping

### Services (Zoho Books Items → Local Services)
| Zoho Books Field | Local Field |
|-----------------|-------------|
| item_id | zohoBooksItemId |
| name | name |
| description | description |
| rate | rate |
| unit | unit |
| sku | sku |
| group_name | category |
| status | active |

### Clients (Local → Zoho)
| Local Field | Zoho Books Contact | Zoho CRM Contact |
|-------------|-------------------|------------------|
| name | contact_name | Full_Name (split to First/Last) |
| email | email | Email |
| phone | phone | Phone |
| company | company_name | Account_Name |

### Quotes (Local → Zoho Books Estimates)
| Local Field | Zoho Books Field |
|-------------|-----------------|
| number | (auto-generated) |
| items | line_items |
| notes | notes |
| terms | terms |
| validUntil | expiry_date |
| discountAmount | discount |
| status | status (sent/accepted/declined) |

### Invoices (Local → Zoho Books Invoices)
| Local Field | Zoho Books Field |
|-------------|-----------------|
| number | invoice_number |
| items | line_items |
| dueDate | due_date |
| status | status (sent/paid) |

## Automatic Sync Triggers

The integration can be configured to auto-sync on:
1. **New Client Created**: Auto-sync to Zoho CRM and Books
2. **Quote Sent**: Auto-sync quote to Zoho Books Estimate
3. **Quote Accepted**: Update Zoho estimate status
4. **Invoice Created**: Auto-sync to Zoho Books
5. **Invoice Paid**: Record payment in Zoho Books

## Rate Limits

Zoho API limits:
- **100 requests per minute** per organization
- Daily limits vary by plan

The integration handles rate limiting by:
- Caching access tokens (valid for 1 hour)
- Batching bulk operations
- Implementing retry logic with backoff

## Troubleshooting

### "Zoho not configured"
- Verify all environment variables are set
- Check `GET /api/zoho/status` for details

### "Failed to refresh access token"
- Refresh token may have expired (happens if unused for 6 months)
- Regenerate the refresh token following setup steps

### "OAUTH-SCOPE-MISMATCH"
- The refresh token doesn't have required scopes
- Regenerate with correct scopes: `ZohoBooks.fullaccess.all,ZohoCRM.modules.ALL`

### Items not syncing
- Check if items are marked as "active" in Zoho Books
- Verify SKU uniqueness

### Duplicate contacts
- The integration uses email as the unique identifier
- Ensure emails are consistent between systems

## Security Notes

- Store credentials securely (never commit to git)
- Use environment variables or secrets management
- Refresh tokens are long-lived - protect them
- Consider IP whitelisting in Zoho if available
