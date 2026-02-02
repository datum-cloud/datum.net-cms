# Strapi CLI: Schema & Type Generation

CLI commands for generating and managing content-type schemas and TypeScript types.

## Commands Overview

| Command | Purpose |
|---------|---------|
| `strapi generate` | Interactive API generator – creates new content-type (schema + controller + service + routes) |
| `strapi ts:generate-types` | Generate TypeScript typings from existing content-type schemas |
| `strapi content-types:list` | List all application content-types |
| `strapi components:list` | List all application components |

---

## 1. Generate New Content-Type (Schema)

Creates a new content-type with schema, controller, service, and routes via interactive prompts.

```bash
npm run strapi generate
```

The CLI will ask:

- Content-type name (singular and plural)
- Attribute types (string, text, number, relation, etc.)
- Whether attributes are required

Output: `src/api/<name>/content-types/<name>/schema.json` plus controller, service, and routes.

---

## 2. Generate TypeScript Types from Schemas

Generates TypeScript definitions from your content-type schemas. Useful after schema changes.

```bash
npm run strapi ts:generate-types
```

Options:

- `--debug` – Show additional logging

Output: `types/generated/contentTypes.d.ts` and `types/generated/components.d.ts`

---

## 3. List Content-Types

List all content-types in the application:

```bash
npm run strapi content-types:list
```

---

## 4. List Components

List all shared components:

```bash
npm run strapi components:list
```

---

## Typical Workflow

1. **Add new content-type**: `npm run strapi generate`
2. **Edit schema**: Modify `src/api/<name>/content-types/<name>/schema.json`
3. **Regenerate types**: `npm run strapi ts:generate-types`
4. **Restart Strapi**: `npm run develop` (types can also be auto-generated on restart if configured)
