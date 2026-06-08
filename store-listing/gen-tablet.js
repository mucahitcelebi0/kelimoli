// Generates 7" and 10" tablet screenshots by centering phone SS on cream background
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = 'C:/Users/win11/Desktop/Ekran görüntüleri';
const OUT_7 = 'C:/Users/win11/Desktop/Ekran görüntüleri/tablet-7';
const OUT_10 = 'C:/Users/win11/Desktop/Ekran görüntüleri/tablet-10';

const ORDER = [5, 6, 7, 11, 9, 8, 1, 10];

const BG = { r: 246, g: 244, b: 238, alpha: 1 };

const SIZE_7 = { w: 1080, h: 1920 };
const SIZE_10 = { w: 1440, h: 2560 };

[OUT_7, OUT_10].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

async function makeTablet(srcPath, outPath, size) {
  const phoneMeta = await sharp(srcPath).metadata();
  const phoneRatio = phoneMeta.width / phoneMeta.height;

  const targetH = Math.round(size.h * 0.95);
  const targetW = Math.round(targetH * phoneRatio);

  const phoneBuf = await sharp(srcPath)
    .resize(targetW, targetH, { kernel: 'lanczos3' })
    .png()
    .toBuffer();

  const left = Math.round((size.w - targetW) / 2);
  const top = Math.round((size.h - targetH) / 2);

  await sharp({
    create: { width: size.w, height: size.h, channels: 4, background: BG }
  })
    .composite([{ input: phoneBuf, left, top }])
    .png()
    .toFile(outPath);
}

(async () => {
  for (let i = 0; i < ORDER.length; i++) {
    const n = ORDER[i];
    const src = path.join(SRC_DIR, `${n}.png`);
    const idx = String(i + 1).padStart(2, '0');

    await makeTablet(src, path.join(OUT_7, `${idx}-tablet7.png`), SIZE_7);
    await makeTablet(src, path.join(OUT_10, `${idx}-tablet10.png`), SIZE_10);
    console.log(`✓ ${n}.png -> ${idx}-tablet7.png + ${idx}-tablet10.png`);
  }
  console.log('\nDone.');
  console.log('7":', OUT_7);
  console.log('10":', OUT_10);
})();
