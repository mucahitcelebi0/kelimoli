# HANDOFF — Mac Claude için tam brief

> Bu doküman Windows'taki Claude sohbetinin sonunda hazırlandı. Şu an kullanıcı Mac'e geçti, **iOS App Store yayını için Xcode/TestFlight aşamasındayız**. Aşağıdaki bilgileri okuyup KALDIĞIMIZ YERDEN devam et.

**Hazırlanma:** 8 Haziran 2026 Pazartesi, sabah
**Hazırlayan:** Windows Claude (Sonnet 4.5)
**Devralan:** Mac Claude — sen.

---

## 🎯 BU MAC SEANSINDA HEDEF

iOS App Store'a Kelimoli'yi göndermek. Şu an her şey hazır, sadece Mac şarttı (Apple Xcode + archive + screenshots).

**Bitiş çizgisi:** TestFlight'a build upload + App Store Connect'e screenshots + "Add for Review" → submit. Apple onayı 1-3 gün, ~15-18 Haziran iOS yayında olunmalı.

---

## 👤 KULLANICI HAKKINDA

- **Ad:** Muhammet Mücahit Çelebi
- **Email:** muhammetmucahit56@gmail.com
- **Dil:** Türkçe konuşuyor, Türkçe yanıt ver
- **Mac tecrübesi:** **Az** — komutları net adım adım anlat, "Cmd+Space → Terminal yaz" gibi
- **Geliştirici tecrübesi:** Orta — Windows'ta build yapabiliyor, ama Xcode/Mac yeni
- **Macbook:** MacBook Pro (Touch Bar'lı, 2019-2022 model — Intel veya Apple Silicon olabilir, "🍎 → About This Mac" ile teyit et)
- **Xcode:** ✅ Kurulu (sürümünü teyit et: Xcode → menü → About Xcode)

---

## 📱 PROJE ÖZETİ

**Kelimoli** — Türklerin İngilizce öğrenmesi için kelime öğrenme uygulaması.
- Capacitor tabanlı (web → Android+iOS native wrapper)
- Web kaynaklar: `app.js`, `index.html`, `styles.css`, `kelimoli-data.js`, `firebase-config.js`, `manifest.json`, `sw.js`, `icon.svg`, `firebase-sync.js`, `revenuecat-config.js`
- Sync flow: kök web dosyaları → `scripts/sync-web.js` → `www/` → `npx cap copy ios/android`
- 3110 kelime, 25 hikaye, 112 false friends, 125 düzensiz fiil, 70 alıntı, 10 sahne
- Firebase Auth + Firestore (kullanıcı: anonim+email/google), AdMob (banner+interstitial+rewarded)

---

## 🍎 APPLE / iOS KİMLİK BİLGİLERİ (KRİTİK)

| Alan | Değer |
|------|-------|
| Apple ID | muhammetmucahit56@gmail.com |
| Apple ID adı | Muhammet Mücahit Çelebi |
| Team ID | **26TL3S2A25** |
| Bundle ID | **com.kelimoli.app** (Apple Developer Portal'da rezerve ✅) |
| App Store Connect App ID | **6777351394** |
| Enrollment ID | NPTQ9A5Y98 |
| DUNS | 94419634 |
| Auto-renew | KAPALI (5 Mayıs 2027 hatırlatması var) |

---

## ✅ DAHA ÖNCE TAMAMLANAN (Windows tarafı, Apple/AdMob/Android)

### App Store Connect (6 Haz Cumartesi tamamlandı)
- ✅ App Information dolduruldu: Subtitle "İngilizce Kelime Akademisi", Category Education+Reference, Age 12+, DSA non-trader
- ✅ Privacy: Policy URL = https://mucahitcelebi0.github.io/kelimoli-privacy/ , App Privacy 9 veri türü beyan + **Published**
- ✅ v1.0 metinleri TR + EN tamamlandı (Description, Keywords, Promotional Text, Support URL, Copyright)
- ✅ App Review Information: "Sign-in NOT required", Notes "Kelimoli is a vocabulary learning app for Turkish speakers learning English. No sign-in required..."
- ✅ Pricing: Free, 175 ülke
- ✅ Version Release: **Manually release** (kullanıcı kontrol edecek)
- ❌ **Screenshots — EKSİK** (Mac/Simulator gerekli)
- ❌ **Build (IPA) — EKSİK** (Mac/Xcode gerekli)

### İkon (8 Haz Pazartesi güncel)
- Master: `icon.svg` (kök dizinde)
- Tasarım: Lacivert gradyan + beyaz serif "K" + sağ üst köşede tavşan kulağı (lacivert gradyan + beyaz kontur)
- Kulak boyutu: rx=14, ry=55 (8 Haz büyütüldü, önceki rx=11, ry=45 idi)
- iOS asset: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024) GÜNCEL
- 94 platform asset üretildi (`npx @capacitor/assets generate --ios --android`)

### Android (referans, Mac'te dokunmuyoruz)
- ✅ v1.0.19 (versionCode 150) AAB derlendi 8 Haz 08:37, 7.94 MB
- ✅ Play Console'a yüklendi 8 Haz sabah → review bekliyor
- ✅ Kapalı test track "Alpha", 12+ opt-in testçi
- ⏳ 14-gün sayacı: 2/14 → ~20 Haz Üretim'e başvurabilir
- ✅ v1.0.18 (code 140) etkin Play Store'da

### AdMob
- ✅ Hesap onaylı 6 Haz
- ✅ Reklam birimleri: banner + interstitial + rewarded
- ✅ İlk kazanç ₺0.07 (8 Haz öncesi)
- ⚠️ "Sınırlı reklam sunumu" — production'a çıkınca tam onay

---

## 🚀 MAC'TE YAPILACAKLAR (sıralı)

### ADIM 1 — Node.js + CocoaPods kurulumu (~10-15 dk)

Kullanıcı muhtemelen yeni Mac kullanıcısı. Önce gerekli araçları kontrol et:

```bash
# Hangileri kurulu kontrol et:
node --version
npm --version
pod --version
xcodebuild -version
```

**Eksikse:**
- **Node.js:** https://nodejs.org/ → LTS sürümünü indir (.pkg)
  - Alternatif: `brew install node` (eğer Homebrew kuruluysa)
- **Homebrew (yoksa, önerilen):**
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```
- **CocoaPods:**
  ```bash
  brew install cocoapods
  # veya:
  sudo gem install cocoapods
  ```
- **Xcode Command Line Tools:**
  ```bash
  xcode-select --install
  ```

### ADIM 2 — npm install (~3-5 dk)

```bash
cd ~/Desktop/kelimoli   # repo klonlanmış olmalı
npm install
```

Bu Capacitor + diğer node modüllerini kurar. `node_modules/` Mac'e özel oluşur (Windows'tan kopyalanmadı, doğru olan bu).

### ADIM 3 — Web assets sync (kritik)

```bash
npm run sync:web   # web kök dosyalarını www/'a kopyalar
npx cap copy ios   # www/ → ios/App/App/public/
```

### ADIM 4 — pod install (~2-3 dk)

```bash
cd ios/App
pod install
```

Bu Capacitor pod'larını + Firebase + AdMob iOS bağımlılıklarını indirir. Sonunda `App.xcworkspace` dosyası kullanılabilir hale gelir.

⚠️ **Önemli:** Hata alırsan büyük olasılıkla "ruby version" veya "pod repo update" gerekir:
```bash
pod repo update
pod install
```

### ADIM 5 — Xcode'da projeyi aç

```bash
open App.xcworkspace
```

⚠️ **`.xcworkspace` aç, `.xcodeproj` AÇMA** — workspace pod'ları içerir, project açarsan derleme hata verir.

### ADIM 6 — Signing & Capabilities

Xcode'da:
1. Sol panelde **App** projesini seç (en üstte)
2. **Signing & Capabilities** sekmesi
3. **Team:** dropdown'dan **"Muhammet Çelebi (26TL3S2A25)"** seç
   - Eğer takım görünmüyorsa: Xcode → Preferences → Accounts → Apple ID ile login
4. **Bundle Identifier:** `com.kelimoli.app` (zaten doğru olmalı)
5. **Automatically manage signing** ✅ açık olmalı

### ADIM 7 — Info.plist'e ATT açıklaması ekle (KRİTİK)

iOS AdMob kullandığı için **App Tracking Transparency** pop-up'ı zorunlu. Olmazsa Apple reddeder.

Dosya: `ios/App/App/Info.plist`

Eklenecek key:
```xml
<key>NSUserTrackingUsageDescription</key>
<string>Kelimoli, sana kişiselleştirilmiş reklamlar göstermek için reklam kimliğini kullanır.</string>
```

Yöntem A — Xcode UI:
1. Xcode → sol panel → App/App/Info.plist
2. Sağ tık → Add Row
3. Key: `NSUserTrackingUsageDescription` (yazmaya başlayınca otomatik tamamlanır)
4. Type: String
5. Value: yukarıdaki Türkçe metin

Yöntem B — Editor ile direkt edit (bash'le yapabilirsin):
```bash
# Info.plist'i kontrol et önce, key var mı?
grep -A1 "NSUserTrackingUsageDescription" ios/App/App/Info.plist
```

Yoksa `<dict>` içine ekle.

### ADIM 8 — Build & Archive (~3-5 dk)

Xcode menü:
1. **Üst bardan device seçici:** "Any iOS Device (arm64)" seç (Simulator değil)
2. Menü → **Product → Archive**
3. Bekle (~3-5 dk) — kod imzalanır, IPA üretilir
4. Tamamlanınca **Organizer** penceresi açılır

### ADIM 9 — TestFlight'a Upload

Organizer'da:
1. Yeni archive'ı seç (üstte olur)
2. **Distribute App** butonu
3. **App Store Connect** → Next
4. **Upload** → Next
5. Otomatik signing → Next → Upload
6. Bekle (~5-10 dk) — Apple sunucularına yükler
7. "Upload Successful" → Done

**Sonra App Store Connect → TestFlight tab → ~10-30 dk sonra build görünür** (processing). Build görününce "Encryption" sorusu sorulur → "No" cevapla (Kelimoli özel şifreleme kullanmıyor, sadece HTTPS).

### ADIM 10 — Simulator'dan Screenshots

Apple zorunlu screenshot boyutu: **6.7" iPhone** (1290 × 2796) veya **6.5" iPhone** (1242 × 2688). En az 3, en fazla 10 ekran.

```bash
# Simulator aç:
open -a Simulator
```

Veya Xcode → Window → Devices and Simulators → iPhone 15 Pro Max (6.7") seç.

Sonra:
```bash
# Terminal'den uygulamayı çalıştır:
cd ~/Desktop/kelimoli
npx cap run ios --target="iPhone 15 Pro Max"
```

Veya Xcode → Run düğmesi (▶) → Simulator'da çalışır.

**Screenshot çekme:** Simulator → ⌘S (Cmd+S) → Desktop'a otomatik kaydedilir.

**Önerilen 5 screenshot:**
1. Ana ekran (kelime kartı, XP/streak görünür)
2. Hikayeler ekranı
3. Quiz/sınav modu
4. False friends ekranı
5. Liderlik tablosu / istatistikler

### ADIM 11 — App Store Connect'e screenshot yükle + Build seç

https://appstoreconnect.apple.com → My Apps → Kelimoli → **1.0 Prepare for Submission**:
1. **Screenshots:** Türkçe + İngilizce için sürükle-bırak (boyut 6.7" iPhone)
2. **Build:** "+" butonu → TestFlight'tan v1.0 (build 1) seç
3. Encryption sorusu: "No" (eğer sorulduysa)
4. **"Add for Review"** butonu → Submit
5. Apple inceleme: 1-3 gün

---

## 🚨 BİLMEN GEREKEN GOTCHALAR

1. **Bundle ID değiştirme:** ASLA. `com.kelimoli.app` sabit. Değişirse App Store Connect'teki app ile bağ kopar.

2. **versionCode/versionName:**
   - Android: build.gradle'da, şu an 150/1.0.19
   - iOS: Xcode'da General → Identity → Version 1.0 / Build 1 (ilk submit)
   - iOS Version = "1.0" yeterli, Build = "1" yeterli

3. **Capacitor sync:** Web dosyası değiştirsen `npm run sync:web && npx cap copy ios` MUTLAKA çalıştır, yoksa Xcode eski versiyonu build eder.

4. **Pod install hataları:**
   - "FirebaseCore not found": `pod repo update && pod install`
   - "Ruby version": `sudo gem install cocoapods` veya Homebrew ile kur

5. **Signing hataları:**
   - "No Account": Xcode → Preferences → Accounts → + → Apple ID
   - "Provisioning profile": Automatic signing açık olsun, Xcode otomatik oluşturur

6. **ATT (NSUserTrackingUsageDescription):**
   - Bu key YOKSA Apple build'i alır ama review'da **kesin reddeder** ("Guideline 5.1.2")
   - Türkçe açıklama olmalı, "kişiselleştirilmiş reklamlar" geçmeli

7. **Encryption export:** Kelimoli sadece HTTPS kullanır, özel kripto yok → "No" cevapla. Yoksa ihracat dokümanı istenir, gereksiz dert.

8. **Screenshots:** Apple kullanıcı arayüzünden çekilen olmalı, mockup/photoshop yasak. Simulator çıktısı OK.

---

## 📂 ÖNEMLİ DOSYA YERLERİ (Mac'te)

```
~/Desktop/kelimoli/
├── app.js                      # ana uygulama mantığı
├── index.html
├── styles.css
├── kelimoli-data.js            # 3110 kelime + içerik
├── firebase-config.js          # Firebase keys (public client keys, gizli değil)
├── icon.svg                    # master ikon (8 Haz büyük tavşan kulağı)
├── package.json
├── capacitor.config.json
├── android/                    # Android (Mac'te dokunma)
├── ios/
│   └── App/
│       ├── Podfile             # CocoaPods bağımlılıkları
│       ├── App.xcworkspace     # BU AÇILACAK
│       ├── App.xcodeproj       # BUNU AÇMA
│       └── App/
│           ├── Info.plist      # NSUserTrackingUsageDescription buraya
│           ├── AppDelegate.swift
│           └── Assets.xcassets/
│               └── AppIcon.appiconset/
│                   └── AppIcon-512@2x.png  # ikon
├── scripts/sync-web.js
├── store-listing/              # Play Store grafikler
└── HANDOFF.md                  # bu dosya
```

---

## 🎬 GÜNÜN YOL HARİTASI (öneri)

| Süre | İş |
|------|-----|
| 10-15 dk | Node + CocoaPods + Xcode CLT kur (eksiklerse) |
| 5 dk | npm install |
| 3 dk | pod install |
| 5 dk | Xcode aç, signing, Info.plist düzenle |
| 5 dk | Archive |
| 10 dk | TestFlight upload (Apple sunucu) |
| 15 dk | Simulator screenshots (5 ekran × 2 dil) |
| 10 dk | App Store Connect upload + submit |
| **~1-1.5 saat** | TOPLAM |

---

## 🔚 SON SÖZ

Kullanıcıya net adımlarla rehber et. Mac'i yeni kullanıyor, sabırlı ol. Her büyük adım sonrası "tamamlandı mı, çıktı nedir?" diye sor.

**Bittiğinde:** Memory'i güncelle (`~/.claude/projects/.../memory/`), `session-state.md`'yi yeni durumla yenile (Mac aşaması tamamlandı, App Store review beklendi).

Kullanıcı 20-27 Haziran arası HEM Android HEM iOS yayında olmayı hedefliyor. Bugün başarılı olursak hedef yakın.

İyi şanslar 🚀

— Windows Claude
