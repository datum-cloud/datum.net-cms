# Strapi Webhook Setup for Astro Cache Invalidation

This document describes how to prepare and configure **Strapi CMS** so that content changes (article/author) trigger cache invalidation on the Astro site. The webhook is configured in Strapi Admin; the receiving endpoint lives on the Node server that hosts Astro (see datum.net).

---

## 1. Overview

**Goal:** When content changes in Strapi (create/update/delete on `article` or `author`), the Astro server invalidates its `.cache/` files so the next request fetches fresh data from Strapi.

**Strapi responsibilities:**

- Emit webhooks on `entry.create`, `entry.update`, `entry.delete` for `article` and `author`.
- Send POST requests to the Astro server webhook URL with a shared secret for verification.

**Out of scope (handled by datum.net):**

- Webhook endpoint implementation.
- Cache file deletion logic.
- `STRAPI_WEBHOOK_SECRET` on the Node server.

---

## 2. Prerequisites

Before configuring the webhook in Strapi:

1. **Webhook endpoint is deployed**  
   The Astro/Node server must expose `POST /webhooks/strapi-content` (or the agreed path). Until it exists, Strapi’s “Test” will fail.

2. **Shared secret agreed**  
   You need a secret string (e.g. from `STRAPI_WEBHOOK_SECRET` on the Node server). Strapi will send this in a header; the endpoint will verify it. Generate a strong secret, e.g.:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **URL per environment**  
   Decide the base URL for each environment:
   - **Production:** `https://your-domain.com`
   - **Staging:** `https://staging.your-domain.com`
   - **Local:** `http://localhost:<port>` (only if the Astro server is reachable from Strapi; usually for dev only).

---

## 3. Environment Variables (Strapi CMS)

Strapi stores webhook URL, headers, and events in the database (Admin UI). No Strapi env vars are **required** for the webhook itself.

Optional reference in `.env` (for your own notes or scripts; not read by Strapi webhooks):

```env
# Optional: same value must be set on the Astro/Node server (STRAPI_WEBHOOK_SECRET)
# STRAPI_WEBHOOK_SECRET=your-shared-secret-here
```

Use this value when adding the `X-Webhook-Secret` header in the webhook configuration below.

---

## 4. Strapi Admin Webhook Configuration

Configure **one webhook** that handles both articles and authors (or split into two if you prefer).

### 4.1 Open Webhooks

1. Log in to Strapi Admin.
2. Go to **Settings** (left sidebar).
3. Under **Global settings**, click **Webhooks**.

### 4.2 Create a new webhook

1. Click **Create new webhook**.
2. Fill in:

| Field | Value |
|-------|--------|
| **Name** | `Astro cache invalidation` (or similar) |
| **URL** | `https://your-domain.com/webhooks/strapi-content` (replace with your Astro server base URL + path) |

### 4.3 Headers (secret)

Add a header so the endpoint can verify the request:

| Header name | Value |
|-------------|--------|
| `X-Webhook-Secret` | `<your-shared-secret>` (same as `STRAPI_WEBHOOK_SECRET` on the Node server) |

Use a long, random string (e.g. from the `node -e "crypto..."` command above).

### 4.4 Events

Enable these events so any change to articles or authors triggers the webhook:

**Article**

- `entry.create` → **Article**
- `entry.update` → **Article**
- `entry.delete` → **Article**

**Author**

- `entry.create` → **Author**
- `entry.update` → **Author**
- `entry.delete` → **Author**

(Exact labels may match your content-type display names.)

### 4.5 Save

Click **Save**. The webhook is active immediately.

### 4.6 Per environment

- **Production Strapi** → Production webhook URL.
- **Staging Strapi** → Staging webhook URL.
- Use separate webhooks or change the URL when switching environments so Strapi does not call the wrong server.

---

## 5. Payload Contract (Reference)

The endpoint will receive POST requests with JSON body (Strapi v4/v5 style). This is for reference and debugging.

**Example: article update**

```json
{
  "event": "entry.update",
  "model": "article",
  "entry": {
    "id": 123,
    "slug": "control-plane-for-modern-service-providers",
    "updatedAt": "2026-02-04T10:00:00.000Z"
  }
}
```

**Example: author update**

```json
{
  "event": "entry.update",
  "model": "author",
  "entry": {
    "id": 5,
    "name": "Jane Doe",
    "updatedAt": "2026-02-04T10:00:00.000Z"
  }
}
```

**Key fields**

| Field | Description |
|-------|-------------|
| `event` | `entry.create` \| `entry.update` \| `entry.delete` |
| `model` | `article` or `author` |
| `entry` | Object; for article should include `slug`; for author, `id` and/or `name` (used only to know author cache is stale). |

On `entry.delete`, `entry` may be minimal; the endpoint should still invalidate by `model` and, for article, by `slug` if present.

---

## 6. Testing

### 6.1 After the endpoint is live

1. In Strapi Admin → **Settings → Webhooks**, open your webhook.
2. Use **Trigger** / **Test** (or equivalent) to send a sample payload.
3. On the Astro server:
   - Check logs to confirm the request was received and verified.
   - Confirm the handler returns `200 OK` so Strapi does not retry.

### 6.2 End-to-end (content change)

1. In Strapi, edit and save one **Article**.
2. Check Astro server logs: webhook received, cache files removed (or similar log).
3. Open the corresponding blog-strapi page on the site; it should show updated content (possibly after the first request that repopulates cache).
4. Repeat for an **Author** (e.g. change name); author-related cache should invalidate and the site should reflect the change.

### 6.3 Troubleshooting

- **401/403:** Secret mismatch. Ensure `X-Webhook-Secret` in Strapi matches `STRAPI_WEBHOOK_SECRET` on the Node server.
- **404:** Wrong URL or path. Confirm base URL and path (e.g. `/webhooks/strapi-content`).
- **Timeout:** Endpoint too slow or unreachable. Keep the handler fast (only invalidate cache; no heavy work).
- **No webhook fired:** Confirm events are set to Article and Author and create/update/delete are selected; try “Test” again.

---

## 7. Summary Checklist

- [ ] Webhook endpoint deployed on Astro/Node server.
- [ ] Shared secret generated and stored on Node server as `STRAPI_WEBHOOK_SECRET`.
- [ ] In Strapi Admin: new webhook with correct URL and `X-Webhook-Secret` header.
- [ ] Events: `entry.create`, `entry.update`, `entry.delete` for **Article** and **Author**.
- [ ] Webhook saved; Test triggered and returned 200.
- [ ] One article and one author edited; server logs and site confirm cache invalidation.
