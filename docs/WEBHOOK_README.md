# Webhook Cache Invalidation Documentation

Complete documentation for automatic cache invalidation when Strapi content changes.

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **`WEBHOOK_IMPLEMENTATION_SUMMARY.md`** | High-level overview, status, and quick start | **Start here** - Get overview and next steps |
| **`WEBHOOK_CACHE_INVALIDATION.md`** | Complete setup guide (Astro + Strapi) | Main reference - Setup, testing, troubleshooting |
| **`WEBHOOK_TESTING_QUICK_REFERENCE.md`** | Quick testing commands and cURL examples | Quick reference when testing |

---

## 🚀 Quick Start

### 1. Read the Summary

Start with `WEBHOOK_IMPLEMENTATION_SUMMARY.md` to understand:
- What's been implemented
- How it works (architecture diagram)
- What you need to do next

### 2. Follow Setup Guide

Use `WEBHOOK_CACHE_INVALIDATION.md` for complete setup:
- **Section 3:** Setup Astro server (datum.net)
- **Section 4:** Configure Strapi webhook (datum.net-cms)
- **Section 5:** Testing (automated + manual + E2E)
- **Section 6:** Production deployment
- **Section 7:** Troubleshooting

### 3. Test with Quick Reference

Use `WEBHOOK_TESTING_QUICK_REFERENCE.md` for quick cURL commands when testing.

---

## 🎯 Typical Workflow

### First Time Setup

1. Read `WEBHOOK_IMPLEMENTATION_SUMMARY.md`
2. Follow `WEBHOOK_CACHE_INVALIDATION.md` Section 3 (Astro setup)
3. Follow `WEBHOOK_CACHE_INVALIDATION.md` Section 4 (Strapi setup)
4. Test using `WEBHOOK_TESTING_QUICK_REFERENCE.md`

### Testing/Debugging

1. Use `WEBHOOK_TESTING_QUICK_REFERENCE.md` for quick cURL commands
2. Check `WEBHOOK_CACHE_INVALIDATION.md` Section 7 for troubleshooting

### Production Deployment

1. Follow `WEBHOOK_CACHE_INVALIDATION.md` Section 6
2. Use checklist in `WEBHOOK_IMPLEMENTATION_SUMMARY.md`

---

## 📁 Related Files in datum.net

Implementation files are located in the Astro project:

```
datum.net/
├── src/pages/api/webhooks/
│   └── strapi-content.ts          ← Webhook endpoint
├── tests/
│   └── test-webhook.sh            ← Automated test script
└── .env                           ← Contains STRAPI_WEBHOOK_SECRET
```

---

## 🔑 Key Concepts

- **Webhook endpoint:** `POST /api/webhooks/strapi-content`
- **Secret header:** `X-Webhook-Secret` (must match in Strapi and Astro)
- **Cache files:** `.cache/strapi-*.json` and `.cache/strapi-*.expires`
- **Events:** `entry.create`, `entry.update`, `entry.delete` for Article and Author

---

## ❓ Common Questions

**Q: Where do I configure the webhook?**  
A: In Strapi Admin → Settings → Webhooks (see Section 4 of main guide)

**Q: How do I test if it's working?**  
A: Run `./tests/test-webhook.sh` from datum.net directory (see quick reference)

**Q: I get 401 Unauthorized, what's wrong?**  
A: Secret mismatch. Check Section 7.1 in main guide for troubleshooting

**Q: Cache files not being deleted?**  
A: Check Section 7.4 in main guide for troubleshooting

**Q: Can I test without Strapi?**  
A: Yes, use cURL commands from quick reference

---

## 📞 Need Help?

1. Check `WEBHOOK_CACHE_INVALIDATION.md` Section 7 (Troubleshooting)
2. Review error messages in Astro server logs
3. Test with automated script: `./tests/test-webhook.sh`

---

**Last Updated:** 2026-02-12
