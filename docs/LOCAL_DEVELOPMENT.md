# Running Strapi CMS Locally

Guide for running the Strapi blog CMS locally before deploying to production.

## Prerequisites

- **Node.js**: 18.x–22.x
- **npm**: 6.x or higher

## Quick Start

### 1. Install dependencies

```bash
cd strapi-blog
npm install
```

### 2. Configure environment

Copy the example env file and set required keys:

```bash
cp .env.example .env
```

Generate secure keys (run each command and paste the output into `.env`):

```bash
# APP_KEYS (comma-separated, at least one)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# API_TOKEN_SALT, ADMIN_JWT_SECRET, TRANSFER_TOKEN_SALT, JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Edit `.env` and replace the placeholder values:

```
APP_KEYS="<paste-first-key>,<paste-second-key>"
API_TOKEN_SALT=<paste-key>
ADMIN_JWT_SECRET=<paste-key>
TRANSFER_TOKEN_SALT=<paste-key>
JWT_SECRET=<paste-key>
```

### 3. Start Strapi in development mode

```bash
npm run develop
```

- **Admin panel**: http://localhost:1337/admin  
- **API**: http://localhost:1337/api  

On first run, you will be prompted to create an admin user.

## Database

- **Local default**: SQLite (`.tmp/data.db`) — no extra setup
- **Production**: Set `DATABASE_CLIENT` and related vars (Postgres/MySQL) in `.env`

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run develop` | Start with auto-reload (local testing) |
| `npm run start` | Start without auto-reload (production-like) |
| `npm run build` | Build admin panel |
| `npm run seed:example` | Seed example data (if available) |
| `npm run sync:authors` | Sync authors from datum.net content |

## Before Production Deploy

1. **Build admin**: `npm run build`
2. **Set production env vars**: Use strong, unique keys (never reuse local keys)
3. **Database**: Use Postgres or MySQL; configure `DATABASE_*` in `.env`
4. **Uploads**: Configure storage (local disk, S3, etc.) for production

## Troubleshooting

- **Port 1337 in use**: Change `PORT` in `.env`
- **Database locked**: Stop other Strapi instances; delete `.tmp/data.db` to reset
- **Admin blank/white**: Run `npm run build` then `npm run develop`
