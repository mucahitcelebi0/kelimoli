#!/usr/bin/env node
/**
 * sync-web.js
 * Kök dizindeki web dosyalarını Capacitor'ın webDir'i olan www/ klasörüne kopyalar.
 * Capacitor cap copy/cap sync komutundan ÖNCE çalıştırılır.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'www');

// www/'ye gidecek dosyalar — burası kaynak listesi.
// Yeni bir asset eklersen buraya da ekle.
const FILES = [
  'index.html',
  'kelimoli-data.js',
  'app.js',
  'styles.css',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'icon-maskable.svg',
  'firebase-config.js',
  'firebase-bundle.js',
  'firebase-sync.js',
  'revenuecat-config.js',
];

// Bütünüyle kopyalanacak klasörler. fonts/ gömülü woff2'leri taşır —
// index.html artık Google Fonts'a gitmiyor, bu dosyalar www/'ye girmezse
// uygulama yedek fontlarla (Georgia / system) açılır.
const DIRS = [
  'fonts',
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copy(file) {
  const src = path.join(ROOT, file);
  const dst = path.join(DEST, file);
  if (!fs.existsSync(src)) {
    console.warn(`  ! Eksik: ${file} (atlandı)`);
    return false;
  }
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
  return true;
}

function copyDir(dir) {
  const src = path.join(ROOT, dir);
  if (!fs.existsSync(src)) {
    console.warn(`  ! Eksik klasör: ${dir}/ (atlandı)`);
    return 0;
  }
  const dst = path.join(DEST, dir);
  ensureDir(dst);
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory()) { n += copyDir(path.join(dir, entry.name)); continue; }
    fs.copyFileSync(path.join(src, entry.name), path.join(dst, entry.name));
    console.log(`  ✓ ${dir}/${entry.name}`);
    n++;
  }
  return n;
}

function main() {
  ensureDir(DEST);
  let ok = 0;
  for (const f of FILES) {
    if (copy(f)) {
      console.log(`  ✓ ${f}`);
      ok++;
    }
  }
  let dirFiles = 0;
  for (const d of DIRS) dirFiles += copyDir(d);
  console.log(`\nKopyalandı: ${ok}/${FILES.length} dosya + ${dirFiles} klasör dosyası → www/`);
}

main();
