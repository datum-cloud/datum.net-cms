#!/usr/bin/env node
/**
 * Migrate Twins in the Loop blog posts (MDX) into the twins-post content type.
 * Idempotent: skips any post whose slug already exists.
 *
 * Usage: node scripts/migrate-twins-post.js
 * Env: POSTS_SOURCE, COVERS_SOURCE
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const mime = require('mime-types');

const POSTS_SOURCE =
  process.env.POSTS_SOURCE || path.join(__dirname, '../../twins-in-the-loop/src/content/posts');
const COVERS_SOURCE =
  process.env.COVERS_SOURCE || path.join(__dirname, '../../twins-in-the-loop/src/assets/covers');

/**
 * @param {fs.PathLike} filePath
 * @param {string} originalFileName
 */
function getFileData(filePath, originalFileName) {
  const size = fs.statSync(filePath).size;
  const ext = originalFileName.split('.').pop();
  const mimetype = mime.lookup(ext || '') || '';
  return { filepath: filePath, originalFileName, size, mimetype };
}

/**
 * @param {{ query: (arg0: string) => { (): any; new (): any; findOne: { (arg0: { where: { name: string; }; }): any; new (): any; }; }; plugin: (arg0: string) => { (): any; new (): any; service: { (arg0: string): { (): any; new (): any; upload: { (arg0: { files: { filepath: any; originalFileName: any; size: number; mimetype: string; }; data: { fileInfo: { alternativeText: string; caption: string; name: string; }; }; }): [any] | PromiseLike<[any]>; new (): any; }; }; new (): any; }; }; }} app
 * @param {string} coverPath
 */
async function uploadCover(app, coverPath) {
  if (!coverPath) return null;
  const fileName = path.basename(coverPath);
  const nameNoExt = fileName.replace(/\.[^.]+$/, '');

  const existing = await app.query('plugin::upload.file').findOne({ where: { name: nameNoExt } });
  if (existing) return existing;

  const absolutePath = path.join(COVERS_SOURCE, fileName);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`Cover not found, skipping upload: ${absolutePath}`);
    return null;
  }

  const fileData = getFileData(absolutePath, fileName);
  const [uploaded] = await app.plugin('upload').service('upload').upload({
    files: fileData,
    data: {
      fileInfo: {
        alternativeText: `Cover image for ${nameNoExt}`,
        caption: nameNoExt,
        name: nameNoExt,
      },
    },
  });
  return uploaded;
}

/**
 * @param {{ documents: (arg0: string) => { (): any; new (): any; findMany: { (arg0: { filters: { slug: { $in: any; }; }; }): any; new (): any; }; }; }} app
 * @param {string | any[]} topicIds
 */
async function resolveTopics(app, topicIds) {
  const slugs = [].concat(topicIds || []).filter(Boolean);
  if (slugs.length === 0) return [];
  const topics = await app.documents('api::topic.topic').findMany({
    filters: { slug: { $in: slugs } },
  });
  return topics.map((/** @type {{ documentId: any; }} */ topic) => topic.documentId);
}

/**
 * @param {string} body
 */
function buildBlocks(body) {
  const trimmed = body.trim();
  if (!trimmed) return [];
  return [{ __component: 'shared.rich-text', body: trimmed }];
}

/**
 * @param {*} app
 * @param {string} fileName
 */
async function migratePost(app, fileName) {
  const slug = fileName.replace(/\.mdx$/, '');

  const existing = await app.documents('api::twins-post.twins-post').findFirst({
    filters: { slug },
  });
  if (existing) {
    console.log(`Skipping "${slug}" (already exists)`);
    return;
  }

  const raw = fs.readFileSync(path.join(POSTS_SOURCE, fileName), 'utf8');
  const { data: frontmatter, content } = matter(raw);

  const cover = await uploadCover(app, frontmatter.cover);
  const topics = await resolveTopics(app, frontmatter.topics);

  const entry = {
    title: frontmatter.title,
    slug,
    description: frontmatter.description,
    excerpt: frontmatter.excerpt,
    tldr: frontmatter.tldr,
    published: frontmatter.published,
    author: frontmatter.author,
    type: frontmatter.type,
    featured: frontmatter.featured ?? false,
    embedUrl: frontmatter.embedUrl,
    canonical: frontmatter.canonical,
    noindex: frontmatter.noindex ?? false,
    seo: {
      keywords: frontmatter.keywords,
      ogTitle: frontmatter.og?.title,
      ogDescription: frontmatter.og?.description,
      ogType: frontmatter.og?.type ?? 'article',
    },
    topics,
    blocks: buildBlocks(content),
    cover: null,
  };
  if (cover) entry.cover = cover.id;

  await app.documents('api::twins-post.twins-post').create({
    data: entry,
    status: 'published',
  });
  console.log(`Created twins-post "${slug}"`);
}

/**
 * @param {any} app
 */
async function migrate(app) {
  const files = fs.readdirSync(POSTS_SOURCE).filter((f) => f.endsWith('.mdx'));
  for (const file of files) {
    try {
      await migratePost(app, file);
    } catch (error) {
      console.error(`Failed to migrate ${file}`, error);
    }
  }
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await migrate(app);
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
