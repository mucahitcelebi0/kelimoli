#!/usr/bin/env node
/**
 * patch-admob.js
 * @capacitor-community/admob@6.2.0 eski UMP API'sini kullanıyor
 * (UMPConsentStatus, UMPConsentInformation.sharedInstance). Eklentinin pod
 * bağımlılığı `GoogleUserMessagingPlatform (>= 1.1)` diye gevşek yazıldığı için
 * pod install bugün 3.x çekiyor ve UMP 3.0 Swift isimlerinden `UMP` önekini
 * kaldırmış → iOS build "'UMPConsentStatus' has been renamed to 'ConsentStatus'"
 * hatasıyla kırılıyor.
 *
 * patches/ altındaki düzeltilmiş dosyaları node_modules'a kopyalar.
 * postinstall olarak çalışır — hem yerelde hem CI'da aynı sonucu verir.
 * (Önceden bu kopyalama yalnızca .github/workflows/ios-build.yml içindeydi,
 * bu yüzden CI geçiyor ama yerel build kırılıyordu.)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN = path.join(ROOT, 'node_modules', '@capacitor-community', 'admob', 'ios', 'Sources', 'AdMobPlugin');

// [kaynak (patches/ içinde), hedef (plugin içindeki göreli yol)]
const PATCHES = [
  ['ConsentExecutor.swift', path.join('Consent', 'ConsentExecutor.swift')],
  ['AdMobPlugin.swift', 'AdMobPlugin.swift'],
];

// Eklenti kurulu değilse (ör. sadece web bağımlılıkları çekildiyse) sessizce çık —
// postinstall'ün npm install'ı kırmaması gerekir.
if (!fs.existsSync(PLUGIN)) {
  console.info('[patch-admob] AdMob eklentisi bulunamadı, atlanıyor.');
  process.exit(0);
}

let applied = 0;
for (const [srcName, destRel] of PATCHES) {
  const src = path.join(ROOT, 'patches', srcName);
  const dest = path.join(PLUGIN, destRel);

  if (!fs.existsSync(src)) {
    console.error(`[patch-admob] HATA: patches/${srcName} yok — yama uygulanamadı.`);
    process.exitCode = 1;
    continue;
  }
  if (!fs.existsSync(dest)) {
    console.error(`[patch-admob] HATA: hedef yok: ${destRel} — eklenti sürümü değişmiş olabilir.`);
    process.exitCode = 1;
    continue;
  }

  // Zaten yamalıysa tekrar yazma — gereksiz dosya değişikliği yaratmasın.
  if (fs.readFileSync(src, 'utf8') === fs.readFileSync(dest, 'utf8')) {
    continue;
  }

  fs.copyFileSync(src, dest);
  applied++;
  console.log(`  ✓ ${srcName} → node_modules/.../${destRel}`);
}

console.log(applied > 0
  ? `[patch-admob] ${applied} yama uygulandı (UMP 3.x uyumu).`
  : '[patch-admob] Yamalar zaten güncel.');
