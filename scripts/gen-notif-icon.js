// Android bildirim ikonu üretici — beyaz "K" siluet (status bar monochrome).
// Çıktı: android/app/src/main/res/drawable-{density}/ic_stat_kelimoli.png
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RES = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Beyaz silüet SVG — şeffaf zemin, beyaz K + beyaz aksan noktası.
// Android status bar ikonu beyaz olmalı; alfa kanalı şekli belirler.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <circle cx="62" cy="30" r="6" fill="#FFFFFF"/>
  <text x="48" y="70" font-family="Georgia, serif" font-size="68" font-weight="800"
        text-anchor="middle" fill="#FFFFFF" letter-spacing="-2">K</text>
</svg>`;

// Bildirim ikonu standart yoğunluk boyutları (24dp tabanlı)
const DENSITIES = [
  { dir: 'drawable-mdpi',    size: 24 },
  { dir: 'drawable-hdpi',    size: 36 },
  { dir: 'drawable-xhdpi',   size: 48 },
  { dir: 'drawable-xxhdpi',  size: 72 },
  { dir: 'drawable-xxxhdpi', size: 96 },
];

(async () => {
  const buf = Buffer.from(svg);
  for (const d of DENSITIES) {
    const dir = path.join(RES, d.dir);
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, 'ic_stat_kelimoli.png');
    await sharp(buf, { density: 384 })
      .resize(d.size, d.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    console.log(`✓ ${d.dir}/ic_stat_kelimoli.png (${d.size}px)`);
  }
  console.log('\nBildirim ikonu üretildi.');
})();
