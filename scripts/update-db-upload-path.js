#!/usr/bin/env node
/**
 * Update all /uploads/ paths in Strapi database to Strapi Cloud media URL
 *
 * This script directly replaces all /uploads/ paths with the cloud media URL
 * without needing to match files in public/uploads/
 *
 * Usage: node scripts/update-db-upload-path.js
 *
 * Note: Make sure Strapi is NOT running when executing this script
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_PATH = path.join(__dirname, '../.tmp/data.db');

// Strapi Cloud media base URL (without trailing slash)
const STRAPI_CLOUD_MEDIA_URL =
  process.env.STRAPI_CLOUD_MEDIA_URL || 'https://grateful-excitement-dfe9d47bad.media.strapiapp.com';

/**
 * Replace all /uploads/ paths with cloud URL in text
 * @param {string} text - Text containing /uploads/ paths
 * @returns {{ text: string, count: number }}
 */
function replaceUploadPaths(text) {
  if (!text) return { text, count: 0 };

  // Match /uploads/filename patterns
  const pattern = /\/uploads\/([^\s)"']+)/g;
  let count = 0;

  const updatedText = text.replace(pattern, (match, filename) => {
    count++;
    return `${STRAPI_CLOUD_MEDIA_URL}/${filename}`;
  });

  return { text: updatedText, count };
}

function main() {
  // Check prerequisites
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Error: Database not found at ${DB_PATH}`);
    console.error('Make sure Strapi has been run at least once to create the database.');
    process.exit(1);
  }

  console.log(`Using cloud URL: ${STRAPI_CLOUD_MEDIA_URL}`);
  console.log('Opening database...');
  const db = new Database(DB_PATH);

  let totalReplacements = 0;

  try {
    // Get all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Available tables:', tables.map((t) => t.name).join(', '));

    // 1. Update rich text bodies (components_shared_rich_texts)
    const richTextTable = tables.find(
      (t) => t.name.includes('rich_text') || t.name.includes('rich-text')
    );

    if (richTextTable) {
      console.log(`\nUpdating ${richTextTable.name}...`);

      const rows = db.prepare(`SELECT id, body FROM ${richTextTable.name} WHERE body IS NOT NULL`).all();
      const updateStmt = db.prepare(`UPDATE ${richTextTable.name} SET body = ? WHERE id = ?`);

      for (const row of rows) {
        const { text: updatedBody, count } = replaceUploadPaths(row.body);
        if (count > 0) {
          updateStmt.run(updatedBody, row.id);
          console.log(`  Rich text id=${row.id}: ${count} path(s) updated`);
          totalReplacements += count;
        }
      }
    }


    console.log(`\n✅ Total replacements: ${totalReplacements}`);

    if (totalReplacements === 0) {
      console.log('No /uploads/ paths found to update.');
    }
  } finally {
    db.close();
    console.log('Database closed.');
  }
}

main();
