#!/usr/bin/env node
/**
 * Seed the initial Topic entries for Twins in the Loop blog posts.
 * Idempotent: skips any topic whose name already exists.
 *
 * Usage: node scripts/seed-topics.js
 */

const TOPICS = ['Data Centers', 'Infrastructure', 'Hardware', 'AI'];

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function seedTopics(app) {
  for (const name of TOPICS) {
    const existing = await app.documents('api::topic.topic').findFirst({
      filters: { name },
    });
    if (existing) {
      console.log(`Skipping "${name}" (already exists)`);
      continue;
    }
    await app.documents('api::topic.topic').create({ data: { name, slug: slugify(name) } });
    console.log(`Created topic "${name}"`);
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await seedTopics(app);
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
