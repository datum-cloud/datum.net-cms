#!/usr/bin/env node
/**
 * Grant the public role read access to the specified content types.
 * Idempotent: skips any action that's already granted.
 *
 * Usage:
 *   node scripts/grant-twins-public-permissions.js api::article.article api::category.category
 */

const contentTypeUids = process.argv.slice(2);

function getActions(app) {
  if (contentTypeUids.length === 0) {
    throw new Error(
      'Provide one or more content-type UIDs, e.g. api::article.article api::category.category'
    );
  }

  return contentTypeUids.flatMap((uid) => {
    if (!app.contentTypes[uid]) {
      throw new Error(`Content type "${uid}" is not registered in this project`);
    }

    return [`${uid}.find`, `${uid}.findOne`];
  });
}

async function grantPermissions(app) {
  const publicRole = await app.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) {
    throw new Error('Public role not found');
  }

  for (const action of getActions(app)) {
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
