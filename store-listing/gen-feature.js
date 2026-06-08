// Feature graphic SVG -> 1024x500 PNG (Play Store)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'feature-graphic.svg');
const outPath = path.join(__dirname, 'feature-graphic-1024x500.png');

const svgBuffer = fs.readFileSync(svgPath);

sharp(svgBuffer)
  .resize(1024, 500)
  .png({ compressionLevel: 9 })
  .toFile(outPath)
  .then((info) => {
    console.log('OK:', outPath, info.width + 'x' + info.height, '(' + info.size + ' bytes)');
  })
  .catch((err) => {
    console.error('ERR:', err.message);
    process.exit(1);
  });
