# Data Migration Options for Strapi Cloud

---

## 1. data.json + Bootstrap Seed (Current Setup)

**Flow:** Commit `data.json` → Deploy → Bootstrap seeds on first start

```bash
# Local: sync authors from datum.net
npm run sync:authors

# Commit & push
git add data/data.json data/uploads/
git commit -m "Update authors"
git push
```

**Pros:** No extra scripts, works on deploy, no API tokens needed  
**Cons:** Requires running `sync:authors` before commit; datum.net must be local

---

## 2. Strapi Transfer (Local → Cloud)

**Flow:** Seed locally → Transfer to Cloud via CLI

```bash
# 1. Seed local Strapi
npm run sync:authors
npm run develop  # or start - bootstrap seeds on first run

# 2. Create Transfer Token in Strapi Cloud Admin
#    Settings → Transfer Tokens → Create (Full Access or Push)

# 3. Transfer from local to cloud (local Strapi must be running)
strapi transfer --to https://your-project.strapiapp.com/admin --to-token YOUR_TOKEN --force
```

**Requires:** `TRANSFER_TOKEN_SALT` in `.env` (already in admin config)

**Pros:** Transfers all content + files in one go, official Strapi feature  
**Cons:** Both instances must run; schema must match exactly; local Strapi must be seeded first

---

## 3. Strapi Export + Import

**Flow:** Export locally → Upload file → Import on Cloud

```bash
# 1. Seed local, then export
npm run sync:authors
npm run develop  # seed first run
strapi export --file backup --no-encrypt --no-compress

# 2. Upload backup.tar.gz to cloud (e.g. via Strapi Cloud file storage or CI)
# 3. On cloud instance, run:
strapi import --file backup.tar.gz
```

**Pros:** Portable backup, can version the export file  
**Cons:** Need a way to run import on Cloud (build hook, manual, or CI); more steps

---

## Summary

| Method                  | When to use                          |
|-------------------------|--------------------------------------|
| **data.json + bootstrap** | Default: commit & deploy             |
| **strapi transfer**      | One-time full migration from local   |
| **export/import**        | Backup/restore, versioned exports    |
