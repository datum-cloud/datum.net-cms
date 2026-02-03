#!/usr/bin/env node
/**
 * Update image paths in data.json to match Strapi-generated hashed filenames
 *
 * Problem: sync-authors-to-data.js creates filenames like `meet_olli_img_1.png`
 * but Strapi generates hashed filenames like `meet_olli_img_1_e6adf9fe4b.png`
 *
 * This script finds the actual hashed filenames in public/uploads/ and updates
 * the paths in data.json accordingly.
 *
 * Usage: node scripts/update-image-paths.js
 */

const fs = require('fs');
const path = require('path');

const DATA_JSON = path.join(__dirname, '../data/data.json');
const PUBLIC_UPLOADS_DIR = path.join(__dirname, '../public/uploads');

/**
 * Find a file in public/uploads/ that matches the base pattern
 * @param {string} originalFilename - e.g., "meet_olli_img_1.png"
 * @returns {string|null} - matched filename with hash or null
 */
function findHashedFile(originalFilename) {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);

  // List all files in public/uploads
  const files = fs.readdirSync(PUBLIC_UPLOADS_DIR);

  // Pattern: baseName + "_" + hash + ext
  // e.g., meet_olli_img_1 -> meet_olli_img_1_e6adf9fe4b.png
  const pattern = new RegExp(`^${escapeRegExp(baseName)}_[a-f0-9]+${escapeRegExp(ext)}$`, 'i');

  const matched = files.find((file) => pattern.test(file));
  return matched || null;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Update image paths in a text body
 * @param {string} body - The body text containing markdown images
 * @returns {{ body: string, replacements: Array }} - Updated body and list of replacements
 */
function updateBodyImagePaths(body) {
  const replacements = [];

  // Match markdown images: ![alt](/uploads/filename.ext)
  const imageRegex = /!\[([^\]]*)\]\(\/uploads\/([^)]+)\)/g;

  const updatedBody = body.replace(imageRegex, (match, alt, filename) => {
    const hashedFilename = findHashedFile(filename);
    if (hashedFilename && hashedFilename !== filename) {
      replacements.push({ original: filename, hashed: hashedFilename });
      return `![${alt}](/uploads/${hashedFilename})`;
    }
    return match;
  });

  return { body: updatedBody, replacements };
}

/**
 * Update cover/avatar/shareImage fields that reference uploads
 * @param {string} filename - The filename (without path)
 * @returns {string} - Updated filename or original if no match
 */
function updateImageField(filename) {
  if (!filename) return filename;
  const hashedFilename = findHashedFile(filename);
  return hashedFilename || filename;
}

function main() {
  // Check if public/uploads exists
  if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
    console.error(`Error: public/uploads directory not found at ${PUBLIC_UPLOADS_DIR}`);
    console.error('Please run "npm run build" or "npm run develop" first to generate Strapi assets.');
    process.exit(1);
  }

  // Read data.json
  const data = JSON.parse(fs.readFileSync(DATA_JSON, 'utf-8'));

  let totalReplacements = 0;

  // Update articles
  if (data.articles && Array.isArray(data.articles)) {
    for (const article of data.articles) {
      // Update cover image
      if (article.cover) {
        const newCover = updateImageField(article.cover);
        if (newCover !== article.cover) {
          console.log(`  Article "${article.slug}" cover: ${article.cover} -> ${newCover}`);
          article.cover = newCover;
          totalReplacements++;
        }
      }

      // Update SEO shareImage
      if (article.seo?.shareImage) {
        const newShareImage = updateImageField(article.seo.shareImage);
        if (newShareImage !== article.seo.shareImage) {
          console.log(`  Article "${article.slug}" shareImage: ${article.seo.shareImage} -> ${newShareImage}`);
          article.seo.shareImage = newShareImage;
          totalReplacements++;
        }
      }

      // Update body images in blocks
      if (article.blocks && Array.isArray(article.blocks)) {
        for (const block of article.blocks) {
          if (block.__component === 'shared.rich-text' && block.body) {
            const { body: updatedBody, replacements } = updateBodyImagePaths(block.body);
            if (replacements.length > 0) {
              block.body = updatedBody;
              for (const r of replacements) {
                console.log(`  Article "${article.slug}" body image: ${r.original} -> ${r.hashed}`);
                totalReplacements++;
              }
            }
          }
        }
      }
    }
  }

  // Update authors
  if (data.authors && Array.isArray(data.authors)) {
    for (let i = 0; i < data.authors.length; i++) {
      const author = data.authors[i];
      if (author.avatar) {
        const newAvatar = updateImageField(author.avatar);
        if (newAvatar !== author.avatar) {
          console.log(`  Author "${author.name}" avatar: ${author.avatar} -> ${newAvatar}`);
          author.avatar = newAvatar;
          totalReplacements++;
        }
      }
    }
  }

  // Update categories
  if (data.categories && Array.isArray(data.categories)) {
    for (const category of data.categories) {
      if (category.featuredImage) {
        const newImage = updateImageField(category.featuredImage);
        if (newImage !== category.featuredImage) {
          console.log(`  Category "${category.slug}" featuredImage: ${category.featuredImage} -> ${newImage}`);
          category.featuredImage = newImage;
          totalReplacements++;
        }
      }
    }
  }

  // Save updated data.json
  fs.writeFileSync(DATA_JSON, JSON.stringify(data, null, 2));

  console.log(`\nUpdated ${totalReplacements} image path(s) in data.json`);

  if (totalReplacements === 0) {
    console.log('No hashed files found in public/uploads/. Make sure Strapi has processed the assets.');
  }
}

main();
