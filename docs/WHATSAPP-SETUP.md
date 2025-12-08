# WhatsApp Business API Integration Setup

This guide explains how to set up WhatsApp Business API integration for the Easy Services Group Helpdesk.

## Overview

The integration allows:
- Receiving WhatsApp messages as helpdesk tickets
- Sending replies from the helpdesk directly to WhatsApp
- Message delivery status tracking (sent, delivered, read)
- Using approved message templates
- Media file support (images, documents, audio, video)

## Prerequisites

1. **Meta Business Account** - [Create one here](https://business.facebook.com/)
2. **WhatsApp Business Account** - Created through Meta Business Manager
3. **Verified Business** - Your business must be verified by Meta
4. **Phone Number** - A phone number to use with WhatsApp Business API

## Step 1: Create Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → Select "Business" type
3. Add "WhatsApp" product to your app
4. Follow the quickstart guide

## Step 2: Get API Credentials

From your Meta App Dashboard:

### Access Token
1. Go to WhatsApp → API Setup
2. Under "Temporary access token", click "Generate"
3. For production, create a System User and generate a permanent token

### Phone Number ID
1. In API Setup, find "Phone number ID"
2. This is under your test/production phone number

### Business Account ID
1. Go to WhatsApp → Getting Started
2. Find "WhatsApp Business Account ID"

## Step 3: Configure Environment Variables

Add to your `.env` file:

```env
# WhatsApp Business API Integration
WHATSAPP_ACCESS_TOKEN="your-access-token-here"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your-business-account-id"
WHATSAPP_VERIFY_TOKEN="esg-whatsapp-verify-2024"
```

## Step 4: Configure Webhook

1. In Meta App Dashboard, go to WhatsApp → Configuration
2. Click "Edit" next to Webhooks
3. Enter your webhook URL:
   ```
   https://helpdesk.easyservicesgroup.co.za/api/webhooks/whatsapp
   ```
4. Enter verify token: `esg-whatsapp-verify-2024` (or your custom token)
5. Subscribe to these webhook fields:
   - `messages` - Receive incoming messages
   - `message_status` - Get delivery status updates

## Step 5: Create Message Templates

Templates are required for:
- Sending the first message to a customer (outside 24-hour window)
- Sending marketing/promotional messages

### Creating Templates
1. Go to WhatsApp → Message Templates in Meta Business Manager
2. Click "Create Template"
3. Choose category (UTILITY recommended for business replies)
4. Write template with placeholders: `Hello {{1}}, your {{2}} is ready.`
5. Submit for approval (usually 24-48 hours)

### Recommended Templates

```
Template: welcome_message
Category: UTILITY
Body: Hello {{1}}! Thank you for contacting Easy Services Group. How can we assist you today?

Template: quote_follow_up
Category: UTILITY
Body: Hi {{1}}, just following up on the quote we sent for {{2}}. Do you have any questions?

Template: document_ready
Category: UTILITY
Body: Good news, {{1}}! Your {{2}} is ready for collection. Please visit our office during business hours or contact us to arrange delivery.

Template: appointment_reminder
Category: UTILITY
Body: Hi {{1}}, this is a reminder of your appointment on {{2}} at {{3}}. Reply YES to confirm or NO to reschedule.

Template: payment_received
Category: UTILITY
Body: Thank you, {{1}}! We have received your payment of R{{2}} for invoice {{3}}. Your receipt will be emailed shortly.
```

## Message Types Supported

### Incoming Messages
- Text messages
- Images (with captions)
- Documents (PDF, DOC, etc.)
- Audio/voice notes
- Video
- Location sharing
- Contacts
- Button responses
- List selection responses

### Outgoing Messages
- Text messages (within 24-hour window)
- Template messages (anytime)
- Images
- Documents

## 24-Hour Messaging Window

WhatsApp enforces a 24-hour customer service window:

1. **Customer initiates contact** → Window opens
2. **You can send regular text messages** for 24 hours
3. **After 24 hours** → Must use approved templates

The helpdesk will:
- Track when customers last messaged
- Show warning when window is closing
- Prompt agents to use templates when window expired

## Testing

### Test with Sandbox
1. Use Meta's test phone numbers during development
2. Add your phone number to allowed test numbers
3. Send test messages to verify webhook

### Verify Webhook
```bash
curl "https://helpdesk.easyservicesgroup.co.za/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=esg-whatsapp-verify-2024&hub.challenge=test123"
```

Should return: `test123`

### Send Test Message
```bash
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "27XXXXXXXXX",
    "type": "text",
    "text": {"body": "Hello from Easy Services!"}
  }'
```

## Troubleshooting

### Messages Not Arriving
1. Check webhook is subscribed to `messages` field
2. Verify webhook URL is publicly accessible
3. Check Meta App dashboard for webhook delivery errors
4. Verify phone number is correctly formatted (no + prefix)

### Cannot Send Messages
1. Verify access token is valid and not expired
2. Check phone number ID is correct
3. Ensure recipient has messaged you first (24-hour window)
4. Use templates for messages outside window

### Template Rejected
1. Avoid promotional language in UTILITY templates
2. Don't include URLs in initial submission
3. Use proper placeholder syntax: `{{1}}`, `{{2}}`
4. Ensure template purpose matches category

## API Reference

### Webhook Endpoints

```
GET  /api/webhooks/whatsapp       - Webhook verification
POST /api/webhooks/whatsapp       - Receive messages & status updates
```

### Message Endpoints

```
POST /api/whatsapp/send           - Send WhatsApp message
GET  /api/whatsapp/templates      - List available templates
```

### Request: Send Message
```json
{
  "ticketId": "ticket-id-here",
  "message": "Your message text",
  "templateName": "optional_template_name",
  "templateParams": ["param1", "param2"]
}
```

### Response: Message Sent
```json
{
  "success": true,
  "messageId": "message-id",
  "whatsappMessageId": "wamid.xxxxx"
}
```

## Production Checklist

- [ ] Business verified with Meta
- [ ] Production phone number configured
- [ ] Permanent access token generated (System User)
- [ ] Message templates approved
- [ ] Webhook URL configured and verified
- [ ] SSL certificate valid on webhook URL
- [ ] Error monitoring configured
- [ ] Rate limits understood (see Meta docs)

## Resources

- [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- [Cloud API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Webhook Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
