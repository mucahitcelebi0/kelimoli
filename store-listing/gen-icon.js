// SVG -> 512x512 PNG (Play Store icon)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'icon.svg');
const outPath = path.join(__dirname, 'app-icon-512.png');

const svgBuffer = fs.readFileSync(svgPath);

sharp(svgBuffer)
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(outPath)
  .then((info) => {
    console.log('OK:', outPath, info.width + 'x' + info.height, '(' + info.size + ' bytes)');
  })
  .catch((err) => {
    console.error('ERR:', err.message);
    process.exit(1);
  });
