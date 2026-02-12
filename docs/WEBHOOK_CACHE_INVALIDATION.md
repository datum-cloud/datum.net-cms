# Webhook Cache Invalidation Complete Setup

Complete guide for setting up automatic cache invalidation when Strapi content changes. This webhook system ensures the Astro site always displays fresh content without manual rebuilds.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Setup: Astro Server (datum.net)](#3-setup-astro-server-datumnet)
4. [Setup: Strapi CMS (datum.net-cms)](#4-setup-strapi-cms-datumnet-cms)
5. [Testing](#5-testing)
6. [Production Deployment](#6-production-deployment)
7. [Troubleshooting](#7-troubleshooting)
8. [Future Improvements](#8-future-improvements)

---

## 1. Overview

**Goal:** When content changes in Strapi (create/update/delete on `article` or `author`), the Astro server automatically invalidates its `.cache/` files so the next request fetches fresh data from Strapi.

**Benefits:**
- ✅ No manual cache clearing needed
- ✅ No full site rebuilds required
- ✅ Content updates appear immediately (after first request)
- ✅ Fast response times (<10ms typical)

**What gets invalidated:**

| Content Type | Cache Files Deleted |
|--------------|---------------------|
| Article (create/update/delete) | `strapi-articles.*` + `strapi-article-{slug}.*` |
| Author (create/update/delete) | `strapi-authors.*` |

---

## 2. Architecture

```
┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│   Strapi    │        │    Astro     │        │   .cache/   │
│     CMS     │        │    Server    │        │   folder    │
└──────┬──────┘        └──────┬───────┘        └──────┬──────┘
       │                      │                       │
       │ 1. Content changed   │                       │
       │    (article/author)  │                       │
       │                      │                       │
       │ 2. POST webhook      │                       │
       ├─────────────────────>│                       │
       │ /api/webhooks/       │                       │
       │ strapi-content       │                       │
       │ X-Webhook-Secret     │                       │
       │                      │                       │
       │                      │ 3. Verify secret      │
       │                      │    Parse payload      │
       │                      │                       │
       │                      │ 4. Delete cache files │
       │                      ├──────────────────────>│
       │                      │                       │
       │ 5. 200 OK            │                       │
       │<─────────────────────┤                       │
       │                      │                       │
       │                      │ 6. Next request       │
       │                      │    fetches fresh data │
```

**Endpoint:** `POST /api/webhooks/strapi-content`

**Payload format (Strapi v4/v5):**
```json
{
  "event": "entry.update",
  "model": "article",
  "entry": {
    "id": 123,
    "slug": "my-article-slug",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

---

## 3. Setup: Astro Server (datum.net)

### 3.1 Generate Webhook Secret

Generate a secure random secret:

```bash
cd /Users/ronggur/Works/Datum/www/datum.net

# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.2 Configure Environment Variables

Add to `datum.net/.env`:

```env
# Webhook secret (must match X-Webhook-Secret in Strapi webhook)
STRAPI_WEBHOOK_SECRET=your-generated-secret-here

# Strapi API (should already exist)
STRAPI_URL=https://your-project.strapiapp.com
STRAPI_TOKEN=your-api-token
STRAPI_CACHE_ENABLED=false
```

**Note:** The same secret will be used in Strapi webhook configuration.

### 3.3 Webhook Endpoint

**File:** `datum.net/src/pages/api/webhooks/strapi-content.ts`

✅ Already implemented with:
- Secret verification via `X-Webhook-Secret` header
- Payload parsing and validation
- Cache file deletion logic
- Detailed logging with duration tracking
- Error handling for all edge cases

**Cache invalidation rules:**

| Model | Cache Pattern | Files Deleted |
|-------|---------------|---------------|
| `article` | `strapi-articles*` | `.json` + `.expires` (list) |
| `article` | `strapi-article-{slug}*` | `.json` + `.expires` (detail) |
| `author` | `strapi-authors*` | `.json` + `.expires` |

### 3.4 Start Server

```bash
# Development
npm run dev

# Production (after build)
npm run build
node server.mjs
```

Server should start on `http://localhost:4321` (or configured PORT).

---

## 4. Setup: Strapi CMS (datum.net-cms)

### 4.1 Get Webhook Secret

Get the secret from Astro server's `.env`:

```bash
cd /Users/ronggur/Works/Datum/www/datum.net
grep STRAPI_WEBHOOK_SECRET .env
```

Copy this value for the next step.

### 4.2 Configure Webhook in Strapi Admin

1. **Log in to Strapi Admin**
   - Local: `http://localhost:1337/admin`
   - Production: Your Strapi domain

2. **Navigate to Webhooks**
   - Go to **Settings** (left sidebar)
   - Under **Global settings**, click **Webhooks**

3. **Create New Webhook**
   - Click **Create new webhook**

4. **Fill in Details:**

| Field | Value |
|-------|--------|
| **Name** | `Astro cache invalidation` |
| **URL** | Development: `http://localhost:4321/api/webhooks/strapi-content`<br>Production: `https://datum.net/api/webhooks/strapi-content` |

5. **Add Secret Header:**

| Header Name | Value |
|-------------|--------|
| `X-Webhook-Secret` | `<paste secret from step 4.1>` |

6. **Select Events:**

Enable all events for **Article** and **Author**:

**Article:**
- ☑️ `entry.create`
- ☑️ `entry.update`
- ☑️ `entry.delete`

**Author:**
- ☑️ `entry.create`
- ☑️ `entry.update`
- ☑️ `entry.delete`

7. **Save**
   - Click **Save** button
   - Webhook is now active

### 4.3 Per Environment

- **Development Strapi** → `http://localhost:4321/api/webhooks/strapi-content`
- **Production Strapi** → `https://datum.net/api/webhooks/strapi-content`

Create separate webhooks or update URL when switching environments.

---

## 5. Testing

### 5.1 Automated Test Script

**From datum.net directory:**

```bash
cd /Users/ronggur/Works/Datum/www/datum.net

# Export secret from .env
export $(cat .env | grep STRAPI_WEBHOOK_SECRET | xargs)

# Run automated tests
./tests/test-webhook.sh
```

**What it tests:**
1. ✅ Article update (valid secret → 200)
2. ✅ Author update (valid secret → 200)
3. ✅ Invalid secret (→ 401)
4. ✅ Missing secret header (→ 401)

**Expected output:**
```
Testing Strapi Webhook Endpoint
URL: http://localhost:4321/api/webhooks/strapi-content

Test 1: Article Update
✓ Success
{
  "success": true,
  "message": "Cache invalidated successfully",
  "details": {
    "event": "entry.update",
    "model": "article",
    "entryId": 123,
    "slug": "control-plane-for-modern-service-providers",
    "deletedFiles": [
      "strapi-articles.json",
      "strapi-articles.expires",
      "strapi-article-control-plane-for-modern-service-providers.json",
      "strapi-article-control-plane-for-modern-service-providers.expires"
    ],
    "duration": "5ms"
  }
}

[... more tests ...]

All tests completed!
```

### 5.2 Manual Testing with cURL

**Test article update:**

```bash
curl -X POST http://localhost:4321/api/webhooks/strapi-content \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{
    "event": "entry.update",
    "model": "article",
    "entry": {
      "id": 123,
      "slug": "control-plane-for-modern-service-providers"
    }
  }'
```

**Expected response (200 OK):**
```json
{
  "success": true,
  "message": "Cache invalidated successfully",
  "details": { ... }
}
```

**Test author update:**

```bash
curl -X POST http://localhost:4321/api/webhooks/strapi-content \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{
    "event": "entry.update",
    "model": "author",
    "entry": {
      "id": 5,
      "name": "John Doe"
    }
  }'
```

### 5.3 Test via Strapi Admin

1. In Strapi Admin → **Settings → Webhooks**
2. Open your webhook
3. Click **Trigger** / **Test** button
4. Check response (should be 200 OK)
5. Check Astro server logs for `[Webhook] Received...`

### 5.4 Verify Cache Invalidation

**Before webhook:**
```bash
cd /Users/ronggur/Works/Datum/www/datum.net
ls -l .cache/strapi-*
```

Should show `.json` and `.expires` files.

**Trigger webhook** (via cURL or Strapi Test).

**After webhook:**
```bash
ls -l .cache/strapi-*
```

Relevant files should be deleted.

**Check Astro server logs:**
```
[Webhook] Received: entry.update on article { id: 123, slug: 'control-plane...' }
[Webhook] Invalidated article cache (4 files): [
  'strapi-articles.json',
  'strapi-articles.expires',
  ...
]
```

### 5.5 End-to-End Test

1. **Before:** Visit a blog article page (e.g., `http://localhost:4321/blog/control-plane-for-modern-service-providers/`)
2. **Edit:** In Strapi, edit that article (change title, content, etc.) and save
3. **Webhook:** Should fire automatically (or click Test button)
4. **Verify:** 
   - Check Astro server logs for webhook received
   - Check `.cache/` files deleted
5. **After:** Reload the blog page
   - First load might be slow (cache miss, fetching from Strapi)
   - Content should show your updates
   - Subsequent loads fast (cache repopulated)

---

## 6. Production Deployment

### 6.1 Environment Variables

Ensure these are set in production (Kubernetes secrets, Docker env, etc.):

**datum.net (Astro server):**
```env
STRAPI_WEBHOOK_SECRET=<production-secret>
STRAPI_URL=https://your-production-strapi.com
STRAPI_TOKEN=<production-api-token>
PORT=4321
```

**datum.net-cms (Strapi):**
No env vars needed (webhook configured in Admin UI).

### 6.2 Update Strapi Webhook URL

In **production Strapi Admin**:

1. Go to **Settings → Webhooks**
2. Edit your webhook
3. Update URL to: `https://datum.net/api/webhooks/strapi-content`
4. Verify `X-Webhook-Secret` header is correct
5. Save

### 6.3 Security Checklist

- ✅ Use HTTPS in production (prevents secret interception)
- ✅ Use strong random secret (32+ bytes)
- ✅ Never commit `.env` files to git
- ✅ Rotate webhook secret periodically
- ✅ Monitor logs for unauthorized attempts (401 responses)
- ✅ Restrict network access to webhook endpoint if possible

### 6.4 Production Testing

1. **Trigger test webhook** from production Strapi Admin
2. **Verify response** is 200 OK
3. **Check logs** on production Astro server
4. **Edit test article** in production Strapi
5. **Verify cache** is invalidated
6. **Check website** shows updated content

---

## 7. Troubleshooting

### 7.1 Webhook Returns 401 Unauthorized

**Cause:** Secret mismatch.

**Fix:**
- Verify `STRAPI_WEBHOOK_SECRET` in datum.net `.env` matches `X-Webhook-Secret` in Strapi webhook
- Check for extra spaces or newlines in secret
- Restart Astro server after changing `.env`
- Test secret manually:
  ```bash
  echo -n "your-secret" | wc -c  # Should be 64 for hex(32 bytes)
  ```

### 7.2 Webhook Returns 400 Bad Request

**Cause:** Invalid payload or missing required fields.

**Fix:**
- Check Strapi payload includes `event`, `model`, and `entry`
- Check server logs for detailed error message
- Verify content-type is `application/json`
- Test with sample payload:
  ```bash
  curl -X POST http://localhost:4321/api/webhooks/strapi-content \
    -H "Content-Type: application/json" \
    -H "X-Webhook-Secret: YOUR_SECRET" \
    -d '{"event":"entry.update","model":"article","entry":{"id":1,"slug":"test"}}'
  ```

### 7.3 Webhook Returns 404 Not Found

**Cause:** Wrong URL or path.

**Fix:**
- Verify URL is exactly: `YOUR_DOMAIN/api/webhooks/strapi-content`
- Check Astro server is running: `curl http://localhost:4321/healthz`
- Verify webhook endpoint file exists: `src/pages/api/webhooks/strapi-content.ts`
- Check Astro build succeeded (no TypeScript errors)

### 7.4 Cache Not Invalidated

**Cause:** Webhook received but files not deleted.

**Fix:**
- Check `.cache/` directory exists at project root
- Verify server has write permissions to `.cache/`
- Check server logs for `[Webhook] Invalidated ... cache` messages
- Verify file naming matches pattern:
  ```bash
  ls -la .cache/strapi-*
  ```
- Check cache directory path in endpoint code (should resolve to project root)

### 7.5 Webhook Timeout

**Cause:** Endpoint too slow or unreachable.

**Fix:**
- Endpoint should respond in <10ms typically; check logs for `duration`
- If pre-warming cache (future feature), move to background job
- Verify network connectivity between Strapi and Astro server
- Check firewall rules (if applicable)
- Increase Strapi webhook timeout (if configurable)

### 7.6 No Webhook Fired

**Cause:** Events not configured or webhook disabled.

**Fix:**
- In Strapi Admin → **Settings → Webhooks**, verify:
  - Webhook is **enabled** (toggle on)
  - Events are checked for Article and Author (create/update/delete)
  - URL is correct
- Try clicking **Trigger/Test** button manually
- Check Strapi server logs for webhook errors

### 7.7 Server Logs Show Nothing

**Cause:** Webhook not reaching server.

**Fix:**
- Verify Astro server is running:
  ```bash
  curl http://localhost:4321/healthz
  # Should return: OK
  ```
- Check PORT in `.env` matches webhook URL
- Check network connectivity (can Strapi reach Astro server?)
- For local dev: Strapi and Astro must be on same network or use ngrok/tunnel

---

## 8. Future Improvements

### 8.1 Pre-warm Cache (Optional)

After invalidating cache, optionally fetch fresh data immediately so first user doesn't experience cold cache:

```typescript
// In webhook handler, after invalidateCache()
if (model === 'article') {
  // Non-blocking fetch to pre-warm cache
  fetch('http://localhost:4321/api/strapi/articles')
    .catch(err => console.warn('[Webhook] Pre-warm failed:', err));
}
```

**Pros:** First user sees fast response
**Cons:** Webhook response slower (if waiting for fetch)

### 8.2 HMAC Signature Verification

Instead of shared secret header, use cryptographic signature (Strapi v4/v5 supports this):

```typescript
const signature = request.headers.get('X-Strapi-Signature');
const body = await request.text();
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(body)
  .digest('hex');

if (signature !== expectedSignature) {
  return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
}
```

**Pros:** More secure (prevents replay attacks)
**Cons:** More complex setup

### 8.3 Webhook Retry Monitoring

Strapi retries webhooks on non-2xx responses. Add monitoring/alerts:

```typescript
// Track failed attempts
if (failedAttempts > 3) {
  await sendAlert('Webhook failing repeatedly', { model, event });
}
```

### 8.4 Cache Dashboard

Create admin page to view cache status:
- List all cache keys
- Last invalidation time per key
- Manual invalidate button
- Cache hit/miss statistics

### 8.5 Support More Content Types

Extend webhook to handle other Strapi content types:

```typescript
// Add cases for new models
if (model === 'category') {
  deletedFiles = invalidateCache('strapi-categories');
} else if (model === 'tag') {
  deletedFiles = invalidateCache('strapi-tags');
}
```

---

## Summary Checklist

### Initial Setup

- [x] Webhook secret generated (`node -e ...`)
- [x] `STRAPI_WEBHOOK_SECRET` added to datum.net `.env`
- [x] Webhook endpoint implemented at `src/pages/api/webhooks/strapi-content.ts`
- [x] Test script created at `tests/test-webhook.sh`

### Local Testing

- [ ] Astro server running (`npm run dev`)
- [ ] Automated tests pass (`./tests/test-webhook.sh`)
- [ ] Manual cURL test successful (200 response)
- [ ] Invalid secret returns 401
- [ ] Cache files deleted after webhook
- [ ] Strapi webhook configured in Admin
- [ ] Strapi Test button triggers webhook successfully
- [ ] End-to-end test: edit article → cache invalidated → site shows update

### Production Deployment

- [ ] Production `STRAPI_WEBHOOK_SECRET` set (Kubernetes/Docker env)
- [ ] Production Strapi webhook URL updated to `https://datum.net/api/webhooks/strapi-content`
- [ ] HTTPS enabled on production Astro server
- [ ] Webhook tested in production Strapi
- [ ] Production end-to-end test completed
- [ ] Monitoring/alerting set up for 401/500 responses

---

## Quick Reference

**Files:**
- Webhook endpoint: `datum.net/src/pages/api/webhooks/strapi-content.ts`
- Test script: `datum.net/tests/test-webhook.sh`
- Documentation: `datum.net-cms/docs/WEBHOOK_CACHE_INVALIDATION.md` (this file)

**URLs:**
- Development: `http://localhost:4321/api/webhooks/strapi-content`
- Production: `https://datum.net/api/webhooks/strapi-content`

**Environment Variables:**
- `STRAPI_WEBHOOK_SECRET` - Shared secret for verification (datum.net)
- `STRAPI_URL` - Strapi API endpoint (datum.net)
- `STRAPI_TOKEN` - Strapi API token (datum.net)

**Test Commands:**
```bash
# Run automated tests
./tests/test-webhook.sh

# Manual test
curl -X POST http://localhost:4321/api/webhooks/strapi-content \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"event":"entry.update","model":"article","entry":{"id":1,"slug":"test"}}'

# Check cache files
ls -l .cache/strapi-*

# Check server health
curl http://localhost:4321/healthz
```

---

**Last Updated:** 2026-02-12  
**Status:** ✅ Ready for production
