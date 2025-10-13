# FlipOps Architecture Decisions

## Date: October 7, 2025

## Key Architecture Choices

### Email Provider: Gmail SMTP (Now) → SendGrid (Later)
**Decision:** Use Gmail SMTP with App Password for immediate deployment.
**Rationale:**
- Zero cost for <500 emails/day
- Already configured in n8n with existing credentials
- Abstract via n8n SMTP credential for seamless future migration
- SendGrid requires API key procurement and billing setup

### Database Schema Design
**Decision:** Separate Property and Notification models with flexible JSON fields.
**Rationale:**
- Property: Core fields as columns for indexing (address, score, city)
- Notification: metadata as JSON for extensibility without migrations
- Composite indices on (type, occurredAt) for query performance
- eventId unique constraint ensures idempotency

### Idempotency Strategy
**Decision:** Dual-layer deduplication.
**Rationale:**
- Guardrail events: eventId uniqueness in Notification table
- Property ingestion: Hash of (address, city, state, zip, date) stored in metadata
- Prevents duplicate processing while allowing property re-evaluation over time

### County Parser Resilience
**Decision:** Three-tier parsing strategy.
**Rationale:**
1. Primary: CSS selectors for table rows
2. Fallback: Regex patterns for row extraction
3. Emergency: Full text dump to manual review queue
- Ensures continuity when county websites change structure

### Cron Scheduling Windows
**Decision:** 2:00 AM ET for county parsers.
**Rationale:**
- County sites typically update between midnight-1 AM
- Avoids peak traffic (9 AM-5 PM)
- Allows buffer before investor morning review (7 AM)
- ET timezone aligns with primary markets (FL, NY)

### Investor DM Mapping
**Decision:** JSON environment variable with fail-closed behavior.
**Rationale:**
- No DM sent if investor unmapped (prevents wrong recipient)
- JSON allows complex routing rules without code changes
- Environment variable enables per-environment configs

### n8n Workflow Tagging
**Decision:** Hierarchical tags: ["flipops", domain-specific].
**Rationale:**
- "flipops" identifies all project workflows
- Secondary tags ("ingestion", "county", "alerts") enable filtered views
- Simplifies bulk operations and monitoring

### Error Channel Strategy
**Decision:** Dedicated #automation-errors Slack channel.
**Rationale:**
- Separates operational errors from business alerts
- Enables different notification thresholds
- Allows dev team monitoring without investor noise

### API Authentication
**Decision:** API key validation with HMAC for webhooks.
**Rationale:**
- Simple API keys for internal service calls
- HMAC-SHA256 for external webhook security
- No OAuth complexity for MVP phase

### Prisma Migration Strategy
**Decision:** Development migrations with explicit production approval.
**Rationale:**
- prisma migrate dev for local development
- Manual review before production deployment
- Preserves rollback capability

### HTTP Retry Policy
**Decision:** 2 retries with exponential backoff (1s, 4s).
**Rationale:**
- Handles transient failures without overload
- 9-second timeout prevents hanging workflows
- Aligns with n8n execution time limits

### Google Sheets Polling vs Trigger
**Decision:** Use polling with 5-minute intervals.
**Rationale:**
- Trigger requires OAuth and user permissions
- Polling works with public/shared sheets
- 5-minute latency acceptable for property discovery

### Notification Deduplication Window
**Decision:** 24-hour window for identical properties.
**Rationale:**
- Prevents alert fatigue from same property
- Allows re-notification if status changes next day
- Stored as hash in Notification.metadata.dedupe_hash

### Environment Variable Precedence
**Decision:** Railway CLI sets only if absent, never overwrites.
**Rationale:**
- Preserves manual configurations
- Prevents accidental secret rotation
- Allows incremental deployment

### Health Check Granularity
**Decision:** Separate health for API, DB, and n8n.
**Rationale:**
- Identifies specific failure points
- Enables targeted alerting rules
- Supports graduated degradation

### Webhook URL Generation
**Decision:** Use RAILWAY_PUBLIC_DOMAIN when available.
**Rationale:**
- Automatic for Railway deployments
- Falls back to explicit FO_API_BASE_URL
- Eliminates manual URL configuration

### Timestamp Storage
**Decision:** UTC in database, ET for user display.
**Rationale:**
- UTC prevents DST issues
- ET aligns with primary user base
- Conversion happens at presentation layer

### Monitoring Tool Choice
**Decision:** Native healthchecks over external services.
**Rationale:**
- No additional dependencies or costs
- Integrates with Railway/Vercel monitoring
- Sufficient for MVP requirements

### Secret Management
**Decision:** Environment variables with no defaults.
**Rationale:**
- Forces explicit configuration
- Prevents accidental use of test credentials
- Railway CLI validates presence

### Batch Size Limits
**Decision:** 100 properties per webhook batch.
**Rationale:**
- Prevents memory overflow
- Keeps under n8n payload limits
- Allows parallel processing

### Score Threshold Configuration
**Decision:** Hardcode 80 threshold initially.
**Rationale:**
- Proven value from testing
- Simplifies initial deployment
- Can be made configurable later

### Data Enrichment Timing
**Decision:** Async enrichment for 85+ scores only.
**Rationale:**
- Reduces API costs (skip tracing expensive)
- Focuses resources on likely deals
- Non-blocking for initial alerts