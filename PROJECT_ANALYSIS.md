# Strapi Cloud Project Analysis

## Project Summary

This project is a blog CMS built using Strapi version 5.34.0, designed for deployment on Strapi Cloud. It manages blog content with modern features including article management, authors, categories, and dynamic content zones. The project includes a data seeding system and migration scripts for syncing content from the datum.net Astro site.

## Technical Information

### Version & Dependencies
- **Strapi**: 5.34.0
- **Node.js**: >=18.0.0 <=24.x.x
- **NPM**: >=6.0.0
- **Database**: SQLite (default, better-sqlite3), with support for MySQL and PostgreSQL via Strapi Cloud
- **Plugins**:
  - `@strapi/plugin-cloud` (5.34.0) - Strapi Cloud integration for deployment
  - `@strapi/plugin-users-permissions` (5.34.0) - User and permissions management
  - `@strapi/plugin-graphql` (^5.28.0) - GraphQL API endpoint with playground
- **Dev Tools**:
  - `eslint` (^9.39.2) - Code linting with ESLint 9 flat config
  - `@eslint/js` (^9.39.2) - ESLint recommended rules

### Project Structure

```
datum.net-cms/
├── config/                  # Application configuration
│   ├── admin.js            # Admin panel configuration
│   ├── api.js              # API configuration
│   ├── database.js         # Database configuration (SQLite/MySQL/PG)
│   ├── middlewares.js      # Middleware configuration
│   ├── plugins.js          # Plugin configuration (GraphQL)
│   └── server.js           # Server configuration (HOST, PORT, APP_KEYS)
├── data/                    # Seed data and uploads
│   ├── data.json           # Seed data (authors, categories, articles, global)
│   └── uploads/            # Media files (authors, blog, og images)
├── src/                     # Application source code
│   ├── api/                # API endpoints and content types
│   │   ├── article/        # Article collection type (Blog Post)
│   │   ├── author/         # Author collection type
│   │   ├── category/       # Category collection type
│   │   └── global/         # Global single type
│   ├── components/         # Reusable components
│   │   └── shared/         # Shared components (media, quote, rich-text, slider, seo, social)
│   └── extensions/         # Custom extensions
├── scripts/                 # Utility scripts
│   ├── seed.js             # Initial data seeding from data.json
│   └── sync-authors-to-data.js  # Sync from datum.net content collection
├── eslint.config.js        # ESLint 9 flat config
└── .vscode/               # VSCode settings (ESLint, extensions)
```

## Data Models

### Article (`api::article.article`)
Main content type for blog posts with:
- `title` (string) - Article title
- `slug` (uid) - Auto-generated from title
- `description` (text) - Short description
- `cover` (media, images) - Article cover image
- `author` (manyToOne) - Relation to Author
- `category` (manyToOne) - Relation to Category
- `blocks` (dynamiczone) - Flexible content blocks: `shared.media`, `shared.quote`, `shared.rich-text`, `shared.slider`
- `seo` (component: `shared.seo`) - SEO metadata
- **Options**: `draftAndPublish: true`

### Author (`api::author.author`)
Model for managing author information:
- `name` (string, required) - Author name
- `title` (string) - Job title/position
- `bio` (text, required) - Author biography
- `avatar` (media: images, files, videos) - Profile picture
- `isTeam` (boolean) - Team member flag
- `team` (enum: "founders" | "team") - Team category
- `social` (component: `shared.social`) - Twitter, GitHub, LinkedIn
- `tick` (text) - Personal tagline/tick
- `surprising` (text) - Surprising fact
- `weekends` (text) - Weekend activities
- `articles` (oneToMany) - Relation to Article
- **Options**: `draftAndPublish: false`

### Category (`api::category.category`)
Model for organizing content:
- `name` (string, required) - Category name
- `slug` (uid) - Auto-generated from name
- `subtitle` (string) - Category subtitle
- `featuredImage` (media, images) - Category featured image
- `description` (text) - Category description
- `articles` (oneToMany) - Relation to Article
- **Options**: `draftAndPublish: false`

### Global (`api::global.global`)
Global site configuration (singleType):
- `siteName` (string, required) - Site name
- `favicon` (media: images, files, videos) - Site favicon
- `siteDescription` (text, required) - Site description
- `defaultSeo` (component: `shared.seo`) - Default SEO configuration
- **Options**: `draftAndPublish: false`

## Dynamic Components

### shared.rich-text
Component for rich text content:
- `body` (richtext) - Rich text body

### shared.media
Component for displaying media:
- `file` (media) - Media file

### shared.quote
Component for displaying quotes:
- `title` (string) - Quote title/attribution
- `body` (text) - Quote body

### shared.slider
Component for displaying image slider:
- `files` (media, multiple) - Slider images

### shared.seo
SEO metadata component:
- `metaTitle` (string, required) - Page title
- `metaDescription` (text, required) - Meta description
- `shareImage` (media, images) - Open Graph share image
- `ogTitle` (string) - Open Graph title override
- `ogDescription` (text) - Open Graph description override

### shared.social
Social media links component:
- `twitter` (string) - Twitter handle
- `github` (string) - GitHub username
- `linkedin` (string) - LinkedIn profile

## Key Features

1. **Blog Content Management**: Complete system for managing articles with authors and categories
2. **Dynamic Zone**: Flexible content blocks using components
3. **Media Management**: Upload and management of media for articles and author profiles
4. **SEO**: Built-in SEO configuration with Open Graph support
5. **Draft & Publish**: Draft and publish system for articles
6. **Permissions**: Permission system for content access control
7. **GraphQL API**: Enabled with playground at `/graphql`
8. **Content Migration**: Script to sync authors/categories/blog from datum.net content collection
9. **Seed Data**: Initial data to start with sample content
10. **Code Quality**: ESLint 9 with flat config for code linting

## Server Configuration

- **Host**: 0.0.0.0 (all interfaces, configurable via `HOST`)
- **Port**: 1337 (configurable via `PORT`)
- **Database**: SQLite (better-sqlite3) locally, MySQL/PostgreSQL on Strapi Cloud
- **Authentication**: JWT for admin panel (keys via `APP_KEYS`, `ADMIN_JWT_SECRET`)
- **Webhooks**: Webhook configuration with `populateRelations` option

## GraphQL Configuration

GraphQL plugin enabled at `/graphql`:
- **Playground**: Always enabled for development
- **Shadow CRUD**: Enabled for auto-generated queries/mutations
- **Depth Limit**: 7 levels
- **Amount Limit**: 100 records
- **Introspection**: Enabled

## How to Run the Project

### Development
```bash
npm run develop
```

### Production
```bash
npm run start
```

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint          # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
```

### Seed Data (initial data population)
```bash
npm run seed:example
```

### Sync Content from datum.net
Sync authors, categories, and blog posts from the datum.net Astro site:
```bash
npm run sync:authors
```

Environment variables:
```bash
AUTHORS_SOURCE=../../datum.net/src/content/authors
CATEGORIES_SOURCE=../../datum.net/src/content/categories
BLOG_SOURCE=../../datum.net/src/content/blog
```

## Strapi Cloud Deployment

### Deploy to Strapi Cloud
```bash
npm run deploy
```

### Environment Variables for Strapi Cloud
Required env vars (configure in Strapi Cloud dashboard):
```bash
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-salt
ADMIN_JWT_SECRET=your-jwt-secret
TRANSFER_TOKEN_SALT=your-salt
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://user:pass@host:5432/dbname  # Strapi Cloud provides
```

### Strapi Cloud Integration
The `@strapi/plugin-cloud` plugin enables:
- Automatic deployment to Strapi Cloud
- Environment variables management in dashboard
- Monitoring and analytics
- Automatic backups
- Scalable hosting with managed PostgreSQL

## Development Setup

### ESLint
Project uses ESLint 9 with flat config (`eslint.config.js`):
- Based on `eslint:recommended`
- Relaxed rules: `no-unused-vars` → warn, `no-console` off
- `strapi` global configured for bootstrap/seed scripts
- Config overrides for Strapi config files
- VSCode settings for auto-fix on save

### VSCode Extensions
Recommended extensions in `.vscode/extensions.json`:
- `dbaeumer.vscode-eslint` - ESLint integration

## Content Migration Workflow

The project includes a migration script (`sync-authors-to-data.js`) to sync content from datum.net:

1. Reads MDX files from `src/content/authors/`, `src/content/categories/`, `src/content/blog/`
2. Extracts frontmatter data and converts to Strapi schema format
3. Copies media files to `data/uploads/` (authors, blog, og images)
4. Generates/updates `data/data.json` with transformed content
5. Run `npm run seed:example` to load into Strapi

This enables continuous content management in the Astro site while syncing to Strapi Cloud.

## Conclusion

This project is a production-ready Strapi 5.34.0 blog CMS configured for Strapi Cloud deployment. It features modern capabilities including dynamic zones for flexible content, GraphQL API, comprehensive SEO support, and a content migration pipeline from the existing datum.net Astro site. The well-organized code structure and ESLint integration make it easy to develop and maintain at scale.
