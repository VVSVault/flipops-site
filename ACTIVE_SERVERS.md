# Active Servers & Tunnels Log

**Last Updated:** November 19, 2025 - 07:10 UTC

---

## Current Running Servers

### Next.js Dev Server ✅ RUNNING
- **Purpose:** FlipOps web application (API routes + UI)
- **Local URL:** http://localhost:3007
- **Process ID:** Background Bash 5e576d
- **Started:** 2025-11-19 07:09 UTC
- **Command:** `cd flipops-site && PORT=3007 npm run dev`
- **Status:** ✅ Active and responding
- **Used By:**
  - Property ingest API `/api/properties/ingest`
  - All API endpoints
  - Development testing

---

## Tunnels

### ngrok Tunnel
- **Purpose:** Expose localhost to n8n workflows (for webhook callbacks)
- **Public URL:** https://d740f7483316.ngrok-free.app
- **Local Target:** http://localhost:3000 (⚠️ Note: Dev server is on 3007 now!)
- **Status:** ⚠️ **NEEDS UPDATE** - pointing to wrong port
- **Action Needed:** Restart ngrok to point to port 3007
  ```bash
  ngrok http 3007
  ```

---

## External Services

### n8n Workflow Server
- **Purpose:** Automation workflows (G1-G4 guardrails, discovery, alerts)
- **Platform:** Railway
- **URL:** https://primary-production-8b46.up.railway.app
- **API Endpoint:** https://primary-production-8b46.up.railway.app/api/v1
- **API Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (see env)
- **Status:** ✅ Running
- **Active Workflows:** 9 (G1, G2, G3, G4, Pipeline Monitoring, etc.)

### ATTOM API
- **Purpose:** Property data provider (nationwide coverage)
- **Endpoint:** https://api.gateway.attomdata.com
- **API Key:** `72403894efb4b2cfeb4b5b41f105a53a`
- **Status:** ✅ Active (30-day trial)
- **Usage:** Property discovery, sales data

### BatchData API
- **Purpose:** Skip tracing (owner contact info)
- **Endpoint:** https://api.batchdata.com
- **API Key:** `eprRFqavyw9vLUP1bZcoUycLJp6EMJxmmnhUGHDy`
- **Status:** ✅ Active
- **Cost:** $0.20 per property traced

---

## Port Usage

| Port | Service | Status |
|------|---------|--------|
| 3000 | ❌ Not in use (old dev server port) | Stopped |
| 3007 | ✅ Next.js Dev Server | Running |
| 5432 | N/A (Would be PostgreSQL if used) | Not applicable (using SQLite) |

---

## Database

### SQLite Database
- **Location:** `flipops-site/prisma/dev.db`
- **Schema:** Multi-tenant (User, Property, DealSpec, etc.)
- **Access:** `npx prisma studio` (opens on http://localhost:5555)
- **Status:** ✅ Active
- **Last Migration:** 20251119064450_add_multi_tenant_support

---

## Quick Reference Commands

### Start Dev Server
```bash
cd flipops-site
PORT=3007 npm run dev
```

### Start ngrok (update to correct port)
```bash
ngrok http 3007
```

### Open Database Studio
```bash
cd flipops-site
npx prisma studio
```

### Test Property Ingest
```bash
cd flipops-site
npx tsx scripts/test-ingest-simple.ts
```

### Fetch ATTOM Properties
```bash
cd flipops-site
npx tsx scripts/fetch-attom-properties-miami.ts
```

---

## Common Issues & Solutions

### Issue: API returns 404
**Solution:** Check if dev server is running on correct port
```bash
curl http://localhost:3007/api/test
```

### Issue: ngrok tunnel expired
**Solution:** Restart ngrok, update n8n workflows with new URL
```bash
ngrok http 3007
# Then update workflows with new URL
```

### Issue: Prisma client errors
**Solution:** Regenerate Prisma client
```bash
cd flipops-site
npx prisma generate
```

---

**Next Update:** When ngrok is restarted or new servers are added
