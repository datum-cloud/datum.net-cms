# Webhook Cache Invalidation Implementation Summary

## ✅ What's Been Implemented

Webhook system for automatic cache invalidation when Strapi content changes.

---

## 📁 Files Created/Modified

### datum.net (Astro/Node Server)

**Created:**
- `src/pages/api/webhooks/strapi-content.ts` - Webhook endpoint handler
- `tests/test-webhook.sh` - Automated test script

**Modified:**
- `.env.example` - Added STRAPI_WEBHOOK_SECRET and Strapi config
- `.env` - Added STRAPI_WEBHOOK_SECRET with generated value

### datum.net-cms (Strapi)

**Created:**
- `docs/WEBHOOK_CACHE_INVALIDATION.md` - Complete setup guide (Astro + Strapi)
- `docs/WEBHOOK_TESTING_QUICK_REFERENCE.md` - Quick testing commands
- `docs/WEBHOOK_IMPLEMENTATION_SUMMARY.md` - Implementation overview

**Modified:**
- `.env.example` - Added optional STRAPI_WEBHOOK_SECRET reference

---

## 🔧 How It Works

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
       │                      │ - strapi-articles.*   │
       │                      │ - strapi-article-{slug}.*
       │                      │ - strapi-authors.*    │
       │                      │                       │
       │ 5. 200 OK            │                       │
       │<─────────────────────┤                       │
       │ {deletedFiles: [...]}│                       │
       │                      │                       │
       │                      │ 6. Next request       │
       │                      │    fetches fresh data │
       │                      │<──────────────────────┤
       │                      │    (cache miss)       │
```

---

## 🚀 Setup Steps

### 1. Astro Server (datum.net)

✅ **Already configured:**
- Webhook secret generated and added to `.env`
- Endpoint implemented at `/api/webhooks/strapi-content`
- Test script ready

**Next: Test locally**

```bash
# 1. Start dev server
npm run dev

# 2. Run tests
export $(cat .env | grep STRAPI_WEBHOOK_SECRET | xargs)
./tests/test-webhook.sh

# Or manual test
curl -X POST http://localhost:4321/api/webhooks/strapi-content \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $(grep STRAPI_WEBHOOK_SECRET .env | cut -d= -f2)" \
  -d '{"event":"entry.update","model":"article","entry":{"id":1,"slug":"test"}}'
```

### 2. Strapi CMS (datum.net-cms)

⚠️ **Action required:**

1. **Get webhook secret** from datum.net `.env`:
   ```bash
   grep STRAPI_WEBHOOK_SECRET ../datum.net/.env
   ```

2. **Configure webhook in Strapi Admin:**
   - Go to **Settings → Webhooks**
   - Click **Create new webhook**
   - Fill in:
     - Name: `Astro cache invalidation`
     - URL: 
       - Dev: `http://localhost:4321/api/webhooks/strapi-content`
       - Prod: `https://datum.net/api/webhooks/strapi-content`
     - Headers: 
       - Name: `X-Webhook-Secret`
       - Value: `<paste secret from step 1>`
     - Events: Select all for **Article** and **Author**:
       - `entry.create`
       - `entry.update`
       - `entry.delete`
   - Save

3. **Test webhook:**
   - Click **Trigger** button in Strapi
   - Check Astro server logs for `[Webhook] Received...`
   - Verify cache files deleted

See: `WEBHOOK_CACHE_INVALIDATION.md` for detailed steps.

---

## 📋 Cache Invalidation Rules

| Model    | Event                  | Cache Files Deleted                        |
|----------|------------------------|--------------------------------------------|
| article  | create/update/delete   | `strapi-articles.*` + `strapi-article-{slug}.*` |
| author   | create/update/delete   | `strapi-authors.*`                         |

**File extensions:**
- `.json` - Cache data
- `.expires` - Expiration timestamp

---

## 🧪 Testing Checklist

### Local Testing

- [ ] Server running (`npm run dev`)
- [ ] `STRAPI_WEBHOOK_SECRET` set in `.env`
- [ ] Automated tests pass (`./tests/test-webhook.sh`)
- [ ] Manual cURL test successful (200 response)
- [ ] Invalid secret returns 401
- [ ] Cache files deleted after webhook

### End-to-End Testing

- [ ] Strapi webhook configured
- [ ] Edit article in Strapi → webhook fires → cache invalidated
- [ ] Visit blog page → shows updated content
- [ ] Edit author in Strapi → author cache invalidated
- [ ] Server logs show `[Webhook]` messages

### Production Checklist

- [ ] `STRAPI_WEBHOOK_SECRET` set in production env
- [ ] Production Strapi webhook URL updated to `https://datum.net/api/webhooks/strapi-content`
- [ ] HTTPS enabled (required for security)
- [ ] Webhook tested in production Strapi
- [ ] Monitor logs for unauthorized attempts (401s)

---

## 📚 Documentation

All webhook documentation is centralized in `datum.net-cms/docs/`:

| File | Purpose |
|------|---------|
| `WEBHOOK_CACHE_INVALIDATION.md` | **Complete guide** - Astro + Strapi setup, testing, troubleshooting |
| `WEBHOOK_TESTING_QUICK_REFERENCE.md` | Quick testing commands and cURL examples |
| `WEBHOOK_IMPLEMENTATION_SUMMARY.md` | Implementation overview and status (this file) |

Implementation files in `datum.net`:
| File | Purpose |
|------|---------|
| `src/pages/api/webhooks/strapi-content.ts` | Webhook endpoint handler |
| `tests/test-webhook.sh` | Automated test script (4 test cases) |

---

## 🔒 Security

✅ **Implemented:**
- Webhook secret verification (`X-Webhook-Secret` header)
- Fast response (<10ms typical) to prevent timeout/retry issues
- Idempotent (safe to retry if Strapi resends)
- Detailed logging for debugging

⚠️ **Production requirements:**
- Use HTTPS (prevents secret interception)
- Rotate webhook secret periodically
- Monitor 401 responses for suspicious activity

---

## 🎯 Next Steps

1. **Test locally** (datum.net):
   ```bash
   npm run dev
   ./tests/test-webhook.sh
   ```

2. **Configure Strapi webhook** (datum.net-cms):
   - Follow **Section 4** in `WEBHOOK_CACHE_INVALIDATION.md`
   - Test with "Trigger" button

3. **End-to-end test:**
   - Edit article in Strapi
   - Verify cache invalidation
   - Check blog page shows update

4. **Deploy to production:**
   - Set env vars
   - Update Strapi webhook URL
   - Test end-to-end in production

---

## 🐛 Troubleshooting

See **Section 7** in `WEBHOOK_CACHE_INVALIDATION.md` for detailed troubleshooting.

**Quick fixes:**

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify STRAPI_WEBHOOK_SECRET matches in .env and Strapi; restart server |
| 400 Bad Request | Check payload format; see logs for details |
| Cache not deleted | Check .cache/ exists and server has write permission |
| Webhook timeout | Endpoint should be fast; check logs for duration |

---

## ✨ Future Enhancements (Optional)

- [ ] Pre-warm cache after invalidation (fetch fresh data immediately)
- [ ] HMAC signature verification instead of shared secret
- [ ] Webhook retry monitoring/alerts
- [ ] Dashboard for cache status and last invalidation time
- [ ] Support for more content types (if needed)

---

**Status:** ✅ Ready for testing

**Last updated:** 2026-02-12
