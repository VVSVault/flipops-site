# n8n Webhook Integration Guide

## Overview

FlipOps provides a webhook endpoint at `/api/webhooks/n8n` to receive property data from your n8n workflows. This enables automated data ingestion from various sources like county records, MLS feeds, and skip tracing services.

## Endpoint Details

**URL:** `https://your-domain.com/api/webhooks/n8n`
**Method:** `POST`
**Content-Type:** `application/json`

## Authentication

Two authentication methods are supported:

### 1. API Key (Recommended)
Include your API key in the request header:
```
x-api-key: your_n8n_api_key_here
```

### 2. Webhook Signature (Optional)
For additional security, configure a webhook secret and include the HMAC-SHA256 signature:
```
x-n8n-signature: sha256_signature_here
```

## Payload Format

### Single Property Import

```json
{
  "type": "property",
  "action": "create",
  "workflowId": "workflow_123",
  "workflowName": "County Records Import",
  "executionId": "exec_456",
  "data": {
    "address": "123 Main St",
    "city": "Miami",
    "state": "FL",
    "zip": "33101",
    "county": "Miami-Dade",
    "ownerName": "John Doe",
    "mailingAddress": "456 Oak Ave, Miami, FL 33102",
    "propertyType": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "squareFeet": 1500,
    "yearBuilt": 1995,
    "assessedValue": 250000,
    "lastSaleDate": "2020-01-15",
    "lastSalePrice": 200000,
    "preForeclosure": false,
    "foreclosure": false,
    "taxDelinquent": true,
    "vacant": false,
    "dataSource": "County Records",
    "sourceId": "APN123456"
  }
}
```

### Batch Property Import

```json
{
  "type": "property",
  "action": "create",
  "workflowName": "Bulk MLS Import",
  "data": [
    {
      "address": "123 Main St",
      "city": "Miami",
      "state": "FL",
      "zip": "33101",
      "ownerName": "John Doe",
      "dataSource": "MLS"
    },
    {
      "address": "456 Oak Ave",
      "city": "Miami",
      "state": "FL",
      "zip": "33102",
      "ownerName": "Jane Smith",
      "dataSource": "MLS"
    }
  ]
}
```

## Property Schema

### Required Fields
- `address` (string): Street address
- `city` (string): City name
- `state` (string): State code (e.g., "FL")
- `zip` (string): ZIP code
- `ownerName` (string): Property owner's name
- `dataSource` (string): Source of the data (e.g., "County Records", "MLS", "Zillow")

### Optional Fields

**Property Details:**
- `county` (string): County name
- `apn` (string): Assessor Parcel Number
- `propertyType` (enum): "single_family", "multi_family", "condo", "townhouse", "land", "commercial"
- `bedrooms` (number): Number of bedrooms
- `bathrooms` (number): Number of bathrooms
- `squareFeet` (number): Square footage
- `lotSize` (number): Lot size in square feet
- `yearBuilt` (number): Year property was built

**Financial Data:**
- `assessedValue` (number): Tax assessed value
- `taxAmount` (number): Annual tax amount
- `lastSaleDate` (string): Date of last sale (ISO format)
- `lastSalePrice` (number): Last sale price
- `estimatedValue` (number): Current estimated value

**Status Indicators:**
- `preForeclosure` (boolean): Pre-foreclosure status
- `foreclosure` (boolean): Foreclosure status
- `bankruptcy` (boolean): Bankruptcy status
- `taxDelinquent` (boolean): Tax delinquency status
- `vacant` (boolean): Vacancy status
- `absenteeOwner` (boolean): Absentee owner status

**Contact Information:**
- `phoneNumbers` (array): Array of phone numbers
- `emails` (array): Array of email addresses
- `mailingAddress` (string): Owner's mailing address

**Metadata:**
- `sourceId` (string): ID from the source system
- `metadata` (object): Custom key-value pairs for additional data

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Processed 2 records",
  "results": [
    {
      "success": true,
      "address": "123 Main St",
      "score": 75,
      "potentialProfit": 45000
    },
    {
      "success": true,
      "address": "456 Oak Ave",
      "score": 60,
      "potentialProfit": 30000
    }
  ],
  "executionId": "exec_456",
  "timestamp": "2024-01-10T15:30:00Z"
}
```

### Error Response (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["data", "address"],
      "message": "Required field missing"
    }
  ]
}
```

## n8n Workflow Setup

### 1. HTTP Request Node Configuration

In your n8n workflow, add an HTTP Request node with these settings:

**Request:**
- Method: `POST`
- URL: `http://localhost:3000/api/webhooks/n8n` (for local testing)
- URL: `https://your-production-domain.com/api/webhooks/n8n` (for production)
- Authentication: Generic Credential Type → Header Auth
- Header Name: `x-api-key`
- Header Value: `fo_live_10177805c8d743e1a6e1860515dc2b3f`

**Options:**
- Body Content Type: `JSON`
- Response Format: `JSON`

### 2. Transform Node Example

Use a Code node to transform your source data to match the FlipOps schema:

```javascript
// Transform county record to FlipOps format
const items = $input.all();

return items.map(item => {
  const record = item.json;

  return {
    json: {
      type: "property",
      action: "create",
      workflowName: $workflow.name,
      executionId: $execution.id,
      data: {
        address: record.PROPERTY_ADDRESS,
        city: record.CITY,
        state: record.STATE,
        zip: record.ZIP_CODE,
        ownerName: record.OWNER_NAME,
        mailingAddress: record.MAIL_ADDRESS,
        assessedValue: parseFloat(record.ASSESSED_VALUE),
        taxDelinquent: record.TAX_STATUS === "DELINQUENT",
        dataSource: "County Records",
        sourceId: record.APN,
        metadata: {
          importDate: new Date().toISOString(),
          county: record.COUNTY
        }
      }
    }
  };
});
```

### 3. Error Handling

Add an Error Trigger node to handle failed webhook calls:

1. Connect the HTTP Request node's error output
2. Send notifications or log errors
3. Optionally retry with exponential backoff

## Property Scoring

The webhook automatically calculates a property score based on:

- **Base Score:** 50 points
- **Pre-foreclosure:** +20 points
- **Foreclosure:** +25 points
- **Tax Delinquent:** +15 points
- **Vacant:** +10 points
- **Absentee Owner:** +5 points

Properties with scores above 70 are considered high-priority opportunities.

## Environment Variables

These are already configured in your `.env.local` file:

```env
# FlipOps API Configuration (ACTIVE CREDENTIALS)
FLIPOPS_API_KEY=fo_live_10177805c8d743e1a6e1860515dc2b3f
FO_API_KEY=fo_live_10177805c8d743e1a6e1860515dc2b3f

# n8n Webhook Secret (from Railway setup - ACTIVE)
FO_WEBHOOK_SECRET=7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb

# n8n Instance URLs (Railway Production)
N8N_BASE_URL=https://primary-production-8b46.up.railway.app
N8N_PUBLIC_WEBHOOK_BASE=https://primary-production-8b46.up.railway.app/webhook

# Notifications (optional - add if using email notifications)
NOTIFICATION_EMAIL=hello@flipops.io
RESEND_API_KEY=[Add your Resend API key if using email notifications]
```

## Testing the Webhook

### Using cURL

```bash
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d '{
    "type": "property",
    "action": "create",
    "workflowName": "Test Import",
    "data": {
      "address": "123 Test St",
      "city": "Miami",
      "state": "FL",
      "zip": "33101",
      "ownerName": "Test Owner",
      "assessedValue": 250000,
      "taxDelinquent": true,
      "dataSource": "Test"
    }
  }'
```

### Health Check

```bash
curl https://your-domain.com/api/webhooks/n8n
```

Returns:
```json
{
  "status": "healthy",
  "endpoint": "/api/webhooks/n8n",
  "timestamp": "2024-01-10T15:30:00Z",
  "acceptedTypes": ["property", "lead", "update", "batch"],
  "authMethods": ["api-key", "signature"]
}
```

## Common n8n Sources to Integrate

1. **County Records**: Property ownership, tax data, foreclosures
2. **MLS Feeds**: Active listings, comparables, market data
3. **Skip Tracing APIs**: Phone numbers, emails, social profiles
4. **Zillow/Redfin**: Property estimates, photos, details
5. **Google Sheets**: Manual lead lists, batch imports
6. **Webhooks**: Third-party integrations

## Rate Limiting

- Default: 100 requests per minute
- Batch imports: Up to 100 properties per request
- Recommended: Use batch imports for large datasets

## Security Best Practices

1. **Use HTTPS only** - Never send data over unencrypted connections
2. **Rotate API keys** - Change keys every 90 days
3. **IP Whitelisting** - Restrict access to known n8n instance IPs
4. **Validate data** - Always validate incoming data format
5. **Monitor usage** - Set up alerts for unusual activity

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check API key is correct
- Verify key is included in `x-api-key` header

**400 Bad Request**
- Validate JSON format
- Ensure required fields are present
- Check data types match schema

**500 Internal Server Error**
- Check server logs
- Verify environment variables are set
- Ensure database connection is working

## Support

For issues or questions:
- Email: support@flipops.io
- Documentation: https://docs.flipops.io
- n8n Community: https://community.n8n.io