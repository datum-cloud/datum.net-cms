#!/usr/bin/env node
/**
 * Grant the public role read access to twins-post/topic so the
 * twins-in-the-loop site can fetch published posts via GraphQL without a token.
 * Idempotent: skips any action that's already granted.
 *
 * Usage: node scripts/grant-twins-public-permissions.js
 */

const ACTIONS = [
  'api::twins-post.twins-post.find',
  'api::twins-post.twins-post.findOne',
  'api::topic.topic.find',
  'api::topic.topic.findOne',
];

async function grantPermissions(app) {
  const publicRole = await app.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    throw new Error('Public role not found');
  }

  for (const action of ACTIONS) {
    const existing = await app.query('plugin::users-permissions.permission').findOne({
      where: { action, role: publicRole.id },
    });
    if (existing) {
      console.log(`Skipping "${action}" (already granted)`);
      continue;
    }
    await app.query('plugin::users-permissions.permission').create({
      data: { action, role: publicRole.id },
    });
    console.log(`Granted "${action}"`);
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await grantPermissions(app);
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
