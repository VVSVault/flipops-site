# FlipOps Slack Alerts Configuration

## Channel Structure

### #guardrail-alerts (C09JDCY5SKH)
**Purpose:** High-value property alerts and guardrail notifications
**Recipients:** Investors, deal analysts
**Alert Types:**
- Properties scoring 80+
- Guardrail blocks (G1, G4)
- Deal stage changes
- Urgent opportunities

**Message Format:**
```
🔥 High-Score Property Alert
━━━━━━━━━━━━━━━━━━━━━━
Score: 92/100
Address: 123 Main St, Miami FL
Profit Potential: $45,000
Distress: Foreclosure, Tax Delinquent

[View Details] [Run Comps]
```

### #automation-errors
**Purpose:** Technical errors and system issues
**Recipients:** Dev team, operations
**Alert Types:**
- Workflow failures
- API errors
- Connection issues
- Parser failures

**Message Format:**
```
❌ Workflow Error
━━━━━━━━━━━━━━━
Workflow: Miami-Dade Parser
Node: HTTP Request
Error: Timeout after 30s
Time: 2025-01-07 02:15:00 ET

[View Execution] [Retry]
```

## Alert Priority Levels

### 🔴 URGENT (96+ Score)
- Mentions: @channel
- Delivery: Immediate
- Channels: Slack + Email + SMS
- Action Required: Within 1 hour

### 🟠 HIGH (86-95 Score)
- Mentions: @investors
- Delivery: Immediate
- Channels: Slack + Email
- Action Required: Within 4 hours

### 🟡 MEDIUM (80-85 Score)
- Mentions: None
- Delivery: Batched (every 2 hours)
- Channels: Slack digest
- Action Required: Same day

### 🟢 INFO (Below 80)
- Mentions: None
- Delivery: Daily summary
- Channels: Email only
- Action Required: Review weekly

## Message Templates

### Property Alert
```javascript
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🔥 Score: {{score}}/100"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*Address:*\n{{address}}"},
        {"type": "mrkdwn", "text": "*City:*\n{{city}}, {{state}}"},
        {"type": "mrkdwn", "text": "*Profit:*\n${{profit}}"},
        {"type": "mrkdwn", "text": "*Source:*\n{{source}}"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Analyze"},
          "style": "primary",
          "url": "{{details_url}}"
        }
      ]
    }
  ]
}
```

### Error Alert
```javascript
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "⚠️ *{{error_type}}*\n```{{error_message}}```"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Workflow: {{workflow}} | Time: {{timestamp}}"
        }
      ]
    }
  ]
}
```

## Investor DM Routing

### Mapping Configuration
```json
{
  "high_value": "U123456789",
  "miami_region": "U234567890",
  "foreclosure_specialist": "U345678901",
  "default": "C09JDCY5SKH"
}
```

### Routing Rules
1. Score 95+ → DM to high_value investor
2. Miami properties → DM to miami_region
3. Foreclosures → DM to foreclosure_specialist
4. All others → Post to channel

## Alert Schedules

### Business Hours (9 AM - 6 PM ET)
- All alerts delivered immediately
- Mentions enabled
- Sound notifications ON

### After Hours (6 PM - 9 AM ET)
- Only 90+ scores delivered
- No mentions except URGENT
- Sound notifications OFF
- Queued for morning delivery

### Weekends
- Only 95+ scores delivered
- Emergency contacts only
- All others queued for Monday

## Bot Configuration

### Required Scopes
- `chat:write` - Post messages
- `channels:read` - List channels
- `im:write` - Send DMs
- `users:read` - Get user info
- `files:write` - Upload documents

### Slash Commands
- `/flipops score [address]` - Get property score
- `/flipops alerts [on/off]` - Toggle alerts
- `/flipops summary` - Daily summary
- `/flipops help` - Show commands

## Alert Aggregation

### Batch Rules
- Same property: Once per 24 hours
- Similar addresses: Group within 1 hour
- Error floods: Max 5 per hour per type
- Success notifications: Daily summary only

### Digest Format
```
📊 FlipOps Daily Digest - {{date}}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Properties Analyzed: {{total}}
High Scores (80+): {{high_count}}
Alerts Sent: {{alert_count}}
Errors: {{error_count}}

Top Properties:
1. {{address1}} - Score: {{score1}}
2. {{address2}} - Score: {{score2}}
3. {{address3}} - Score: {{score3}}

[View Full Report]
```

## Integration Points

### From n8n Workflows
- Use Slack node with Bot token
- Channel ID from environment variable
- Dynamic block construction
- Error handling with fallback

### From Next.js API
- Use @slack/web-api client
- Async message posting
- Retry with exponential backoff
- Log message timestamps

### From Monitoring Tools
- Webhook URL: `https://hooks.slack.com/services/...`
- JSON payload format
- Custom username/icon
- Channel override support

## Troubleshooting

### Common Issues

**Bot not in channel:**
- Error: `channel_not_found` or `not_in_channel`
- Fix: Invite bot with `/invite @FlipOps`

**Rate limiting:**
- Error: `rate_limited`
- Fix: Implement queuing, respect retry-after header

**Invalid blocks:**
- Error: `invalid_blocks` or `invalid_blocks_format`
- Fix: Validate JSON structure, check field limits

**Token expired:**
- Error: `token_revoked` or `invalid_auth`
- Fix: Regenerate bot token in Slack app settings

## Metrics to Track

- Messages sent per hour/day
- Click-through rate on buttons
- Response time to alerts
- False positive rate
- Alert-to-deal conversion

## On-Duty Contacts

**Primary:** Configure in environment
**Secondary:** Configure in environment
**Escalation:** Via PagerDuty integration