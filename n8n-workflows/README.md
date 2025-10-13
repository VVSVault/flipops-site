# n8n Workflows for FlipOps Integration

## Available Workflows

### 1. FlipOps Property Import (ID: tBhObghFUCkjjrtB)
**Status:** ✅ Created in your n8n instance
**Description:** Basic workflow to send property data to FlipOps webhook

This workflow:
- Triggers manually for testing
- Sends a sample property to FlipOps
- Returns the property score and potential profit

### How to Use the Workflow

1. **Access n8n Dashboard**
   - Go to: https://primary-production-8b46.up.railway.app
   - Navigate to Workflows

2. **Find "FlipOps Property Import"**
   - Open the workflow
   - Click "Execute Workflow" to test

3. **Customize the Data**
   - Edit the "Send to FlipOps" node
   - Modify the JSON body with your property data
   - Save and execute

## Workflow Templates

### County Records Import
```json
{
  "type": "property",
  "action": "create",
  "workflowName": "County Records Import",
  "data": {
    "address": "123 Main St",
    "city": "Miami",
    "state": "FL",
    "zip": "33101",
    "ownerName": "John Doe",
    "county": "Miami-Dade",
    "apn": "123-456-789",
    "assessedValue": 250000,
    "taxAmount": 3500,
    "taxDelinquent": false,
    "dataSource": "County Records"
  }
}
```

### Foreclosure List Import
```json
{
  "type": "property",
  "action": "create",
  "workflowName": "Foreclosure Import",
  "data": {
    "address": "456 Distressed Ave",
    "city": "Fort Lauderdale",
    "state": "FL",
    "zip": "33301",
    "ownerName": "Distressed Owner",
    "preForeclosure": true,
    "foreclosure": false,
    "assessedValue": 180000,
    "lastSalePrice": 220000,
    "dataSource": "Foreclosure List"
  }
}
```

### MLS Feed Import
```json
{
  "type": "property",
  "action": "create",
  "workflowName": "MLS Import",
  "data": {
    "address": "789 Market St",
    "city": "Miami Beach",
    "state": "FL",
    "zip": "33139",
    "ownerName": "Market Seller",
    "propertyType": "single_family",
    "bedrooms": 3,
    "bathrooms": 2,
    "squareFeet": 1800,
    "yearBuilt": 1995,
    "estimatedValue": 450000,
    "dataSource": "MLS"
  }
}
```

## Batch Import Example

For importing multiple properties at once:

```json
{
  "type": "property",
  "action": "create",
  "workflowName": "Batch Import",
  "data": [
    {
      "address": "111 First St",
      "city": "Miami",
      "state": "FL",
      "zip": "33101",
      "ownerName": "Owner One",
      "assessedValue": 200000,
      "dataSource": "Batch Import"
    },
    {
      "address": "222 Second Ave",
      "city": "Miami",
      "state": "FL",
      "zip": "33102",
      "ownerName": "Owner Two",
      "assessedValue": 300000,
      "taxDelinquent": true,
      "dataSource": "Batch Import"
    }
  ]
}
```

## API Configuration

### Webhook Endpoint
- **Local Testing:** `http://localhost:3000/api/webhooks/n8n`
- **Production:** `https://your-domain.com/api/webhooks/n8n`

### Authentication
- **Header Name:** `x-api-key`
- **Header Value:** `fo_live_10177805c8d743e1a6e1860515dc2b3f`

## Property Scoring

Properties are automatically scored based on:
- Base Score: 50 points
- Pre-foreclosure: +20 points
- Foreclosure: +25 points
- Tax Delinquent: +15 points
- Vacant: +10 points
- Absentee Owner: +5 points

Properties scoring 70+ are flagged as high-priority opportunities.

## Common Data Sources to Connect

1. **Google Sheets**
   - Use Google Sheets node
   - Read property data from spreadsheet
   - Transform to FlipOps format
   - Send to webhook

2. **CSV Files**
   - Use Read Binary Files node
   - Parse CSV with Spreadsheet File node
   - Map columns to FlipOps schema
   - Batch send to webhook

3. **APIs**
   - Use HTTP Request node for source API
   - Transform response data
   - Send to FlipOps webhook

4. **Databases**
   - Use MySQL/PostgreSQL nodes
   - Query property records
   - Transform results
   - Send to FlipOps

## Testing Your Integration

### Using cURL
```bash
curl -X POST http://localhost:3000/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-api-key: fo_live_10177805c8d743e1a6e1860515dc2b3f" \
  -d '{
    "type": "property",
    "action": "create",
    "data": {
      "address": "Test Property",
      "city": "Miami",
      "state": "FL",
      "zip": "33101",
      "ownerName": "Test Owner",
      "dataSource": "Test"
    }
  }'
```

### Expected Response
```json
{
  "success": true,
  "message": "Processed 1 records",
  "results": [
    {
      "success": true,
      "address": "Test Property",
      "score": 50,
      "potentialProfit": 0
    }
  ],
  "timestamp": "2025-10-07T09:00:00.000Z"
}
```

## Troubleshooting

### 401 Unauthorized
- Check API key is correct
- Verify header name is `x-api-key`

### 400 Bad Request
- Validate JSON format
- Ensure required fields: address, city, state, zip, ownerName, dataSource

### Connection Refused
- Check webhook URL is correct
- Verify server is running (for local testing)

## Support

For help with:
- n8n workflows: Check n8n documentation
- FlipOps integration: Review webhook documentation
- API issues: Check credentials and endpoints