#!/usr/bin/env node
/**
 * Sync authors, categories, and blog from datum.net content collection to data.json
 * Copies images: authors → data/uploads/authors/, categories → data/uploads/,
 * blog → data/uploads/blog/
 *
 * Usage: node scripts/sync-authors-to-data.js
 * Env: AUTHORS_SOURCE, CATEGORIES_SOURCE, BLOG_SOURCE
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const AUTHORS_SOURCE =
  process.env.AUTHORS_SOURCE ||
  path.join(__dirname, '../../datum.net/src/content/authors');
const CATEGORIES_SOURCE =
  process.env.CATEGORIES_SOURCE ||
  path.join(__dirname, '../../datum.net/src/content/categories');
const BLOG_SOURCE =
  process.env.BLOG_SOURCE ||
  path.join(__dirname, '../../datum.net/src/content/blog');
const DATA_JSON = path.join(__dirname, '../data/data.json');
const UPLOADS_DIR = path.join(__dirname, '../data/uploads');
const UPLOADS_AUTHORS_DIR = path.join(UPLOADS_DIR, 'authors');
const UPLOADS_BLOG_DIR = path.join(UPLOADS_DIR, 'blog');

function getAuthorFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...getAuthorFiles(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name) && !entry.name.startsWith('_')) {
      files.push(fullPath);
    }
  }
  return files;
}

function loadAuthors(sourceDir) {
  const authors = [];
  const files = getAuthorFiles(sourceDir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = matter(content).data;
    if (!data || !data.name) continue;
    const slug = path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);
    let avatarPath = null;
    if (data.avatar) {
      avatarPath = path.isAbsolute(data.avatar)
        ? data.avatar
        : path.join(dir, data.avatar);
      if (!fs.existsSync(avatarPath)) avatarPath = null;
    }
    authors.push({
      slug,
      name: data.name,
      title: data.title,
      bio: data.bio || '',
      avatarPath,
      isTeam: data.isTeam === true || data.isTeam === 'true',
      team: data.team === 'founders' || data.team === 'team' ? data.team : null,
      social: data.social
        ? typeof data.social === 'string'
          ? JSON.parse(data.social)
          : data.social
        : null,
      tick: data.tick,
      surprising: data.surprising,
      weekends: data.weekends,
    });
  }
  return authors;
}

function toDataJsonFormat(author, avatarFilename) {
  const entry = {
    name: author.name,
    bio: author.bio,
    isTeam: author.isTeam,
  };
  if (author.title) entry.title = author.title;
  if (author.team) entry.team = author.team;
  if (author.tick) entry.tick = author.tick;
  if (author.surprising) entry.surprising = author.surprising;
  if (author.weekends) entry.weekends = author.weekends;
  if (avatarFilename) entry.avatar = avatarFilename;
  if (
    author.social &&
    (author.social.twitter || author.social.github || author.social.linkedin)
  ) {
    entry.social = author.social;
  }
  return entry;
}

function getCategoryFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...getCategoryFiles(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name) && !entry.name.startsWith('_')) {
      files.push(fullPath);
    }
  }
  return files;
}

function loadCategories(sourceDir) {
  const categories = [];
  const files = getCategoryFiles(sourceDir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = matter(content).data;
    if (!data || !data.name) continue;
    const slug = data.slug || path.basename(filePath, path.extname(filePath));
    const dir = path.dirname(filePath);
    let featuredImagePath = null;
    if (data.featuredImage) {
      featuredImagePath = path.isAbsolute(data.featuredImage)
        ? data.featuredImage
        : path.join(dir, data.featuredImage);
      if (!fs.existsSync(featuredImagePath)) featuredImagePath = null;
    }
    categories.push({
      name: data.name,
      slug,
      subtitle: data.subtitle || undefined,
      description: data.description || undefined,
      featuredImagePath,
    });
  }
  return categories;
}

function toCategoryDataJsonFormat(category, featuredImageFilename) {
  const entry = { name: category.name, slug: category.slug };
  if (category.subtitle) entry.subtitle = category.subtitle;
  if (category.description) entry.description = category.description;
  if (featuredImageFilename) entry.featuredImage = featuredImageFilename;
  return entry;
}

function stripMdxBody(content) {
  const body = content
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/<Figure[^>]*>/g, '')
    .replace(/<\/Figure>/g, '')
    .trim();
  return body;
}

function extractAndCopyBodyImages(body, fileDir, slug, blogUploadsDir) {
  const imageRegex = /!\[([^\]]*)\]\((\.\/)?([^)]+)\)/g;
  let match;
  let result = body;
  let idx = 0;
  while ((match = imageRegex.exec(body)) !== null) {
    const alt = match[1];
    const imgPath = path.join(fileDir, match[3]);
    if (fs.existsSync(imgPath)) {
      const ext = path.extname(imgPath);
      const destName = `${slug}-img-${++idx}${ext}`;
      const destPath = path.join(blogUploadsDir, destName);
      fs.copyFileSync(imgPath, destPath);
      result = result.replace(match[0], `![${alt}](/uploads/blog/${destName})`);
    }
  }
  return result;
}

function getBlogFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...getBlogFiles(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name) && !entry.name.startsWith('_')) {
      files.push(fullPath);
    }
  }
  return files;
}

function loadBlogPosts(sourceDir, authorSlugToId, categorySlugToId) {
  const posts = [];
  const files = getBlogFiles(sourceDir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: bodyContent } = matter(content);
    if (!data || !data.title) continue;
    if (data.draft === true) continue;

    const slug = data.slug || path.basename(filePath, path.extname(filePath));
    const fileDir = path.dirname(filePath);

    const authorId = data.author ? authorSlugToId[data.author] : null;
    const categorySlug =
      Array.isArray(data.categories) && data.categories.length
        ? data.categories[0]
        : null;
    const categoryId = categorySlug ? categorySlugToId[categorySlug] : null;

    let coverPath = null;
    const coverSrc = data.featuredImage || data.thumbnail;
    if (coverSrc) {
      coverPath = path.isAbsolute(coverSrc)
        ? coverSrc
        : path.join(fileDir, coverSrc);
      if (!fs.existsSync(coverPath)) coverPath = null;
    }

    let ogImagePath = null;
    const ogImageSrc = data.meta?.og?.image;
    if (ogImageSrc) {
      ogImagePath = path.isAbsolute(ogImageSrc)
        ? ogImageSrc
        : path.join(fileDir, ogImageSrc);
      if (!fs.existsSync(ogImagePath)) ogImagePath = null;
    }

    const metaTitle = data.meta?.title || data.title;
    const metaDescription = data.meta?.description || data.description || '';
    const ogTitle = data.meta?.og?.title;
    const ogDescription = data.meta?.og?.description;

    const rawBody = stripMdxBody(bodyContent);
    const body = extractAndCopyBodyImages(rawBody, fileDir, slug, UPLOADS_BLOG_DIR);

    const date = data.date ? new Date(data.date) : null;
    const originalPublishedAt = date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
    const firstPublishedAt = data.firstPublishedAt
      ? (() => {
          const d = new Date(data.firstPublishedAt);
          return !Number.isNaN(d.getTime()) ? d.toISOString() : originalPublishedAt;
        })()
      : originalPublishedAt;

    posts.push({
      slug,
      title: data.title,
      description: data.description || '',
      authorId,
      categoryId,
      coverPath,
      ogImagePath,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      body,
      originalPublishedAt,
      firstPublishedAt,
    });
  }
  return posts.sort((a, b) => {
    const aDate = a.originalPublishedAt || a.firstPublishedAt;
    const bDate = b.originalPublishedAt || b.firstPublishedAt;
    if (aDate && bDate) return bDate.localeCompare(aDate);
    return a.slug < b.slug ? -1 : 1;
  });
}

function toArticleDataJsonFormat(post, coverFilename, ogImageFilename) {
  const entry = {
    title: post.title,
    slug: post.slug,
    description: post.description,
    blocks: [{ __component: 'shared.rich-text', body: post.body }],
  };
  if (post.authorId) entry.author = { id: post.authorId };
  if (post.categoryId) entry.category = { id: post.categoryId };
  if (post.originalPublishedAt) entry.originalPublishedAt = post.originalPublishedAt;
  if (post.firstPublishedAt) entry.firstPublishedAt = post.firstPublishedAt;
  if (coverFilename) entry.cover = coverFilename;
  if (post.metaTitle || post.metaDescription) {
    entry.seo = {
      metaTitle: post.metaTitle || post.title,
      metaDescription: post.metaDescription || post.description || '',
    };
    if (post.ogTitle) entry.seo.ogTitle = post.ogTitle;
    if (post.ogDescription) entry.seo.ogDescription = post.ogDescription;
    if (ogImageFilename) entry.seo.shareImage = ogImageFilename;
  }
  return entry;
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_JSON, 'utf-8'));

  // Sync categories
  if (fs.existsSync(CATEGORIES_SOURCE)) {
    const categories = loadCategories(CATEGORIES_SOURCE);
    const dataJsonCategories = [];
    for (const category of categories) {
      let featuredImageFilename = null;
      if (category.featuredImagePath) {
        const ext = path.extname(category.featuredImagePath);
        featuredImageFilename = `${category.slug}${ext}`;
        const destPath = path.join(UPLOADS_DIR, featuredImageFilename);
        fs.copyFileSync(category.featuredImagePath, destPath);
        console.log(`  Copied category image: ${featuredImageFilename}`);
      }
      dataJsonCategories.push(toCategoryDataJsonFormat(category, featuredImageFilename));
    }
    data.categories = dataJsonCategories;
    console.log(`Synced ${categories.length} categories`);
  } else {
    console.warn(`Categories source not found: ${CATEGORIES_SOURCE}`);
  }

  // Sync authors
  if (!fs.existsSync(AUTHORS_SOURCE)) {
    console.error(`Authors source not found: ${AUTHORS_SOURCE}`);
    process.exit(1);
  }

  const authors = loadAuthors(AUTHORS_SOURCE);
  console.log(`Found ${authors.length} authors`);

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_AUTHORS_DIR)) {
    fs.mkdirSync(UPLOADS_AUTHORS_DIR, { recursive: true });
  }

  const defaultAvatarPath = path.join(UPLOADS_DIR, 'default-image.png');
  if (fs.existsSync(defaultAvatarPath)) {
    fs.copyFileSync(defaultAvatarPath, path.join(UPLOADS_AUTHORS_DIR, 'default-image.png'));
  }

  const dataJsonAuthors = [];
  for (const author of authors) {
    let avatarFilename = null;
    if (author.avatarPath) {
      const ext = path.extname(author.avatarPath);
      const name = `${author.slug}${ext}`;
      avatarFilename = `authors/${name}`;
      fs.copyFileSync(author.avatarPath, path.join(UPLOADS_AUTHORS_DIR, name));
      console.log(`  Copied avatar: authors/${name}`);
    } else {
      avatarFilename = 'authors/default-image.png';
      if (fs.existsSync(path.join(UPLOADS_AUTHORS_DIR, 'default-image.png'))) {
        console.log(`  Using default avatar for ${author.name}`);
      }
    }
    dataJsonAuthors.push(toDataJsonFormat(author, avatarFilename));
  }

  data.authors = dataJsonAuthors;

  // Sync blog
  if (fs.existsSync(BLOG_SOURCE)) {
    if (!fs.existsSync(UPLOADS_BLOG_DIR)) {
      fs.mkdirSync(UPLOADS_BLOG_DIR, { recursive: true });
    }

    const authorSlugToId = {};
    authors.forEach((a, i) => {
      authorSlugToId[a.slug] = i + 1;
    });
    const categorySlugToId = {};
    (data.categories || []).forEach((c, i) => {
      categorySlugToId[c.slug] = i + 1;
    });

    const posts = loadBlogPosts(BLOG_SOURCE, authorSlugToId, categorySlugToId);
    const dataJsonArticles = [];

    for (const post of posts) {
      let coverFilename = null;
      if (post.coverPath) {
        const ext = path.extname(post.coverPath);
        const name = `${post.slug}-cover${ext}`;
        coverFilename = `blog/${name}`;
        fs.copyFileSync(post.coverPath, path.join(UPLOADS_BLOG_DIR, name));
        console.log(`  Copied cover: blog/${name}`);
      }
      let ogImageFilename = null;
      if (post.ogImagePath) {
        const ext = path.extname(post.ogImagePath);
        const name = `${post.slug}-og${ext}`;
        ogImageFilename = `blog/${name}`;
        fs.copyFileSync(post.ogImagePath, path.join(UPLOADS_BLOG_DIR, name));
        console.log(`  Copied og image: blog/${name}`);
      }
      dataJsonArticles.push(toArticleDataJsonFormat(post, coverFilename, ogImageFilename));
    }

    data.articles = dataJsonArticles;
    console.log(`Synced ${dataJsonArticles.length} blog posts`);
  } else {
    console.warn(`Blog source not found: ${BLOG_SOURCE}`);
  }

  fs.writeFileSync(DATA_JSON, JSON.stringify(data, null, 2));
  console.log(`Updated data.json`);
}

main();
