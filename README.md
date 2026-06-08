# Kelimoli — Geliştirme & Build Rehberi

Türkçe→İngilizce kelime öğrenme uygulaması. Web prototip + PWA + Capacitor Android.

## Klasör yapısı

```
İngilizce/
├── index.html, app.js, styles.css      # KAYNAK dosyalar (burada düzenle)
├── manifest.json, sw.js, icon*.svg     # PWA dosyaları
├── www/                                # Capacitor build hedefi (otomatik)
├── android/                            # Native Android projesi (Capacitor üretir)
├── scripts/sync-web.js                 # Kaynakları www/'ye kopyalar
├── capacitor.config.json
└── package.json
```

> **Önemli:** Her zaman kök dizindeki dosyaları düzenle. `www/` ve `android/` otomatik üretilir, elle değiştirme.

---

## 1. Web olarak çalıştırmak (geliştirme)

Service worker'ın çalışması için local server gerekir:

```powershell
cd "C:\Users\ahmet\Desktop\İngilizce"
npx serve -l 5173
```

Tarayıcıda: http://localhost:5173

**Telefonda PWA testi:** Aynı Wi-Fi ağında, telefonun tarayıcısından `http://<bilgisayar-ip>:5173` aç → Chrome menüsünden "Ana ekrana ekle".

---

## 2. Android APK üretmek

### İlk kurulum (bir kez)

```powershell
npm install
npx cap add android
```

### Her değişiklikten sonra

```powershell
npm run android
```

Bu komut sırasıyla:
1. Kök dosyaları `www/`'ye kopyalar (`scripts/sync-web.js`)
2. `www/`'yi `android/app/src/main/assets/public/`'ye kopyalar (`cap copy`)
3. Android Studio'yu açar

### Android Studio'da

1. Sağ üstte "app" konfigürasyonu seçili olmalı
2. Üstte ▶ (Run) butonu — bağlı telefon veya emulator'a kurar
3. APK üretmek için: **Build menüsü → Build Bundle(s) / APK(s) → Build APK(s)**
4. APK yolu: `android/app/build/outputs/apk/debug/app-debug.apk`

### Telefona kurmak

- **Yöntem A (USB):** Telefonda Geliştirici Modu + USB Debug aç. Android Studio'da "Run" butonu telefona doğrudan kurar.
- **Yöntem B (manuel):** APK dosyasını telefona kopyala (USB, e-posta, Drive). Telefon ayarlarından "Bilinmeyen kaynaklara izin ver" → APK'ya dokun → kur.

---

## 3. Ortam değişkenleri

Capacitor'ın Android SDK'yı bulması için aşağıdaki değişkenler ayarlanmış olmalı:

```
ANDROID_HOME      = C:\Users\ahmet\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT  = C:\Users\ahmet\AppData\Local\Android\Sdk
```

Kontrol:
```powershell
echo $env:ANDROID_SDK_ROOT
```

Boşsa: PowerShell'i kapatıp yeniden aç (setx yeni oturumlardan itibaren geçerlidir).

---

## 4. Yeni kelime / sahne ekleme

- Kelimeler: `app.js` → `WORDS` dizisi
- Günün ilham cümleleri: `app.js` → `QUOTES` dizisi
- Film sahneleri: `app.js` → `SCENES` dizisi
- A2 defteri kaynağı: Ahmet'in not defteri (ad-hoc kelime ekleme).

---

## 5. Yapılacaklar (yol haritası)

- [x] Onboarding + seviye yerleştirme testi
- [x] PWA altyapısı (manifest, service worker, ikonlar)
- [x] Capacitor Android wrap
- [ ] Firebase Auth + bulut senkronizasyon
- [ ] Liglar / haftalık leaderboard
- [ ] Arkadaş ekle + seri paylaş
- [ ] Kalpler/canlar sistemi + premium
- [ ] AI konuşma partneri
- [ ] Türk öğrencilere özel "false friends" modülü
