#!/usr/bin/env node
/**
 * Fix: migrate-twins-post.js passed a bare documentId array for the `topics`
 * many-to-many relation, which Strapi's document service silently mishandled
 * (orphaned link rows with no twins_post_id). Reconnects each post to its
 * topics using `{ connect: [...] }`, which links correctly.
 *
 * Topic slugs below are recovered from the original post frontmatter
 * (twins-in-the-loop git history), since they were never persisted.
 *
 * Usage: node scripts/fix-twins-post-topics.js
 */

const POST_TOPICS = {
  'ai-and-datacenter-conversations': ['ai', 'data-centers'],
  'arm-owns-the-datacenter': ['hardware', 'data-centers'],
  'arms-next-chapter': ['hardware'],
  'ask-me-about-the-weather': ['ai'],
  'i-invented-bare-metal': ['hardware'],
  'implications-of-geopolitical-decoupling': ['infrastructure'],
  'impossible-to-buy-datacenter-space': ['data-centers'],
  'live-coding-a-cli-in-rust': ['infrastructure'],
  'nobody-cares-about-gandalf': ['infrastructure'],
  'on-device-ai': ['ai', 'hardware'],
  'reading-500-incident-reports': ['infrastructure'],
  'reduced-deploy-times': ['infrastructure'],
  'simplify-then-add-lightness': ['hardware'],
  'taking-writing-lessons': ['ai'],
  'zero-downtime-schema-migrations': ['infrastructure'],
};

async function fixTopics(app) {
  // Clear the orphaned link rows left by the original migration.
  await app.db.connection('twins_blogs_topics_lnk').del();

  for (const [slug, topicSlugs] of Object.entries(POST_TOPICS)) {
    const topics = await app.documents('api::topic.topic').findMany({
      filters: { slug: { $in: topicSlugs } },
    });
    const topicDocumentIds = topics.map((topic) => topic.documentId);

    for (const status of ['draft', 'published']) {
      const post = await app.documents('api::twins-post.twins-post').findFirst({
        filters: { slug },
        status,
      });
      if (!post) {
        console.warn(`No ${status} version found for "${slug}"`);
        continue;
      }
      await app.documents('api::twins-post.twins-post').update({
        documentId: post.documentId,
        data: { topics: { connect: topicDocumentIds } },
        status,
      });
    }
    console.log(`Linked "${slug}" to [${topicSlugs.join(', ')}]`);
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await fixTopics(app);
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
