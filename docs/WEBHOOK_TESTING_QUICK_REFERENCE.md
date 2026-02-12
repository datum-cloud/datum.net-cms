# Quick Testing Guide: Webhook Cache Invalidation

## Before Testing

Make sure:
1. Astro server is running (`npm run dev` or `node server.mjs`)
2. `STRAPI_WEBHOOK_SECRET` is set in `.env`
3. `.cache/` directory exists with some strapi cache files

## Quick Test Commands

### 1. Check current cache files

```bash
ls -la .cache/strapi-*
```

### 2. Test article update webhook

```bash
# Replace YOUR_SECRET with actual STRAPI_WEBHOOK_SECRET from .env
curl -X POST http://localhost:4321/api/webhooks/strapi-content \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{
    "event": "entry.update",
    "model": "article",
    "entry": {
      "id": 1,
      "slug": "control-plane-for-modern-service-providers"
    }
  }'
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Cache invalidated successfully",
  "details": {
    "event": "entry.update",
    "model": "article",
    "entryId": 1,
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
```

### 3. Test author update webhook

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

**Expected response (200):**
```json
{
  "success": true,
  "message": "Cache invalidated successfully",
  "details": {
    "event": "entry.update",
    "model": "author",
    "entryId": 5,
    "deletedFiles": [
      "strapi-authors.json",
      "strapi-authors.expires"
    ],
    "duration": "3ms"
  }
}
```

### 4. Test invalid secret (should fail)

```bash
curl -X POST http://localhost:4321/api/webhooks/strapi-content \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: wrong-secret" \
  -d '{
    "event": "entry.update",
    "model": "article",
    "entry": {"id": 1, "slug": "test"}
  }'
```

**Expected response (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 5. Verify cache was deleted

```bash
ls -la .cache/strapi-*
```

Files related to the tested article/author should be gone.

## Automated Test

Run the full test suite:

```bash
# Source the env vars
export $(cat .env | grep STRAPI_WEBHOOK_SECRET | xargs)

# Run test script
./tests/test-webhook.sh
```

## End-to-End Test

1. **Before:** Visit a blog page (e.g., `/blog/control-plane-for-modern-service-providers/`)
2. **In Strapi:** Edit that article (change title, content, etc.) and save
3. **Trigger webhook:** Either automatically (if configured in Strapi) or use "Test" button
4. **After:** Reload the blog page - first load might be slow (cache miss), but content should be updated

## Troubleshooting

### Server not responding
- Check if dev server is running: `curl http://localhost:4321/healthz`
- Check PORT in .env (default: 4321)

### 401 Unauthorized
- Verify STRAPI_WEBHOOK_SECRET matches in `.env` and webhook header
- Restart server after changing `.env`

### Cache not deleted
- Check server logs for `[Webhook]` messages
- Verify `.cache/` directory path is correct
- Check file permissions (server needs write access to `.cache/`)

### No cache files exist
- Visit some blog pages first to populate cache
- Or run: `npm run dev` and visit `/blog/` and a few article pages

## Complete Documentation

For full setup guide, troubleshooting, and production deployment:
- See: `WEBHOOK_CACHE_INVALIDATION.md` (in this directory)
