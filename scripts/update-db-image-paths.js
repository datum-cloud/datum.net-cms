#!/usr/bin/env node
/**
 * Update image paths in Strapi SQLite database to match hashed filenames
 *
 * This script directly updates the database to replace original filenames
 * with Strapi-generated hashed filenames from public/uploads/
 *
 * Usage: node scripts/update-db-image-paths.js
 *
 * Note: Make sure Strapi is NOT running when executing this script
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../.tmp/data.db');
const PUBLIC_UPLOADS_DIR = path.join(__dirname, '../public/uploads');

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find a file in public/uploads/ that matches the base pattern
 * @param {string} originalFilename - e.g., "meet_olli_img_1.png"
 * @returns {string|null} - matched filename with hash or null
 */
function findHashedFile(originalFilename) {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);

  const files = fs.readdirSync(PUBLIC_UPLOADS_DIR);

  // Pattern: baseName + "_" + hash + ext
  const pattern = new RegExp(`^${escapeRegExp(baseName)}_[a-f0-9]+${escapeRegExp(ext)}$`, 'i');

  const matched = files.find((file) => pattern.test(file));
  return matched || null;
}

/**
 * Update image paths in a text body (markdown content)
 * @param {string} body - The body text containing markdown images
 * @returns {{ body: string, replacements: Array }}
 */
function updateBodyImagePaths(body) {
  if (!body) return { body, replacements: [] };

  const replacements = [];
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

function main() {
  // Check prerequisites
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Error: Database not found at ${DB_PATH}`);
    console.error('Make sure Strapi has been run at least once to create the database.');
    process.exit(1);
  }

  if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
    console.error(`Error: public/uploads directory not found at ${PUBLIC_UPLOADS_DIR}`);
    console.error('Please run "npm run build" or "npm run develop" first to generate Strapi assets.');
    process.exit(1);
  }

  console.log('Opening database...');
  const db = new Database(DB_PATH);

  let totalReplacements = 0;

  try {
    // Get all tables to understand the schema
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Available tables:', tables.map((t) => t.name).join(', '));

    // Update articles (shared.rich-text component body field)
    // In Strapi v5, component data is stored in components_shared_rich_texts table
    const richTextTable = tables.find(
      (t) => t.name.includes('rich_text') || t.name.includes('rich-text')
    );

    if (richTextTable) {
      console.log(`\nUpdating rich text bodies in ${richTextTable.name}...`);

      const rows = db.prepare(`SELECT id, body FROM ${richTextTable.name} WHERE body IS NOT NULL`).all();

      const updateStmt = db.prepare(`UPDATE ${richTextTable.name} SET body = ? WHERE id = ?`);

      for (const row of rows) {
        const { body: updatedBody, replacements } = updateBodyImagePaths(row.body);
        if (replacements.length > 0) {
          updateStmt.run(updatedBody, row.id);
          for (const r of replacements) {
            console.log(`  Rich text id=${row.id}: ${r.original} -> ${r.hashed}`);
            totalReplacements++;
          }
        }
      }
    }

    // Update files table - this is where Strapi stores file metadata
    // The 'name' and 'url' fields need to be updated
    const filesTable = tables.find((t) => t.name === 'files');

    if (filesTable) {
      console.log('\nUpdating files table...');

      const files = db.prepare('SELECT id, name, url, hash FROM files').all();

      for (const file of files) {
        // Check if there's a hashed version of this file
        const hashedFilename = findHashedFile(file.name);
        if (hashedFilename && hashedFilename !== file.name) {
          const newUrl = `/uploads/${hashedFilename}`;

          // Extract hash from filename (e.g., "file_abc123.png" -> "abc123")
          const ext = path.extname(hashedFilename);
          const baseName = path.basename(hashedFilename, ext);
          const hashMatch = baseName.match(/_([a-f0-9]+)$/i);
          const newHash = hashMatch ? hashMatch[1] : file.hash;

          db.prepare('UPDATE files SET name = ?, url = ?, hash = ? WHERE id = ?').run(
            hashedFilename,
            newUrl,
            newHash,
            file.id
          );

          console.log(`  File id=${file.id}: ${file.name} -> ${hashedFilename}`);
          totalReplacements++;
        }
      }
    }

    // Also check for articles table with body content (alternative structure)
    const articlesTable = tables.find((t) => t.name === 'articles');

    if (articlesTable) {
      // Check if articles table has a body column directly
      const columns = db.prepare(`PRAGMA table_info(${articlesTable.name})`).all();
      const hasBody = columns.some((c) => c.name === 'body');

      if (hasBody) {
        console.log('\nUpdating articles body field...');

        const articles = db
          .prepare(`SELECT id, title, body FROM ${articlesTable.name} WHERE body IS NOT NULL`)
          .all();

        const updateStmt = db.prepare(`UPDATE ${articlesTable.name} SET body = ? WHERE id = ?`);

        for (const article of articles) {
          const { body: updatedBody, replacements } = updateBodyImagePaths(article.body);
          if (replacements.length > 0) {
            updateStmt.run(updatedBody, article.id);
            for (const r of replacements) {
              console.log(`  Article "${article.title}": ${r.original} -> ${r.hashed}`);
              totalReplacements++;
            }
          }
        }
      }
    }

    console.log(`\nTotal replacements: ${totalReplacements}`);

    if (totalReplacements === 0) {
      console.log('No updates needed. Either:');
      console.log('  - All paths are already correct');
      console.log('  - No hashed files found in public/uploads/');
      console.log('  - No matching patterns in database content');
    }
  } finally {
    db.close();
    console.log('\nDatabase closed.');
  }
}

main();
