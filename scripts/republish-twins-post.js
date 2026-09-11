#!/usr/bin/env node
/**
 * Fix: migrate-twins-post.js created entries with status "published", but the
 * published version ended up without its topics/blocks/cover relations
 * (only the draft version got them). Republishing from the current draft
 * copies its content into the published version.
 *
 * Usage: node scripts/republish-twins-post.js
 */

const CONTENT_TYPE_UID = 'api::twins-post.twins-post';

async function republishAll(app) {
  const drafts = await app.documents(CONTENT_TYPE_UID).findMany({
    status: 'draft',
  });

  for (const draft of drafts) {
    const published = await app.documents(CONTENT_TYPE_UID).findFirst({
      documentId: draft.documentId,
      status: 'published',
    });

    if (!published) {
      console.log(`Skipping "${draft.slug}" (no published version to repair)`);
      continue;
    }

    await app.documents(CONTENT_TYPE_UID).publish({
      documentId: draft.documentId,
    });
    console.log(`Republished "${draft.slug}"`);
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await republishAll(app);
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
