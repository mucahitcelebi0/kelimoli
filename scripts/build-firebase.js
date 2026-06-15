#!/usr/bin/env node
/**
 * build-firebase.js
 * Firebase JS SDK'yı tek bir bundle'a paketler (kök dizinde firebase-bundle.js).
 * Çıkış noktası: window.FirebaseBundle
 *
 * Çalıştır: npm run build:firebase
 * sync-web.js kopyalamadan ÖNCE çalışmalı.
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(ROOT, 'scripts', 'firebase-entry.js');
const OUT = path.join(ROOT, 'firebase-bundle.js');

async function main() {
  const result = await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: 'iife',
    outfile: OUT,
    minify: true,
    sourcemap: false,
    target: ['es2022'],
    metafile: true,
    logLevel: 'info',
  });

  const stats = fs.statSync(OUT);
  console.log(`✓ firebase-bundle.js → ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch((e) => {
  console.error('Bundle başarısız:', e);
  process.exit(1);
});
