#!/usr/bin/env node

import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcConfigDir = join(rootDir, 'src', 'config');
const distConfigDir = join(rootDir, 'dist', 'config');

// Create dist/config directory if it doesn't exist
mkdirSync(distConfigDir, { recursive: true });

// Copy all JSON files from src/config to dist/config
const files = readdirSync(srcConfigDir).filter(file => file.endsWith('.json'));

for (const file of files) {
  const srcPath = join(srcConfigDir, file);
  const destPath = join(distConfigDir, file);
  copyFileSync(srcPath, destPath);
  console.log(`Copied ${file} to dist/config/`);
}

console.log(`Successfully copied ${files.length} config file(s)`);
