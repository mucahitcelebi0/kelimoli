# iOS Güncelleme Rehberi

Kelimoli'nin App Store'a **güncelleme** göndermesi. İlk yayın değil — o `HANDOFF.md`'de anlatılıyordu ve artık geçerli değil (Xcode'dan elle Archive yapılıyordu, şimdi CI yapıyor).

Tüm süreç kabaca **10 dakika iş + 1-3 gün Apple incelemesi**.

---

## Bölüm 1 — Kodda sürüm yükselt

Sürüm iki yerde tanımlı, ikisi de `ios/App/App.xcodeproj/project.pbxproj` içinde (dosyada ikişer kez geçer, Debug ve Release için):

| Alan | Ne demek | Örnek |
|---|---|---|
| `MARKETING_VERSION` | Kullanıcının gördüğü sürüm | `1.0.6` |
| `CURRENT_PROJECT_VERSION` | Build numarası | `4` |

**Kural:** Her App Store yüklemesinde build numarası bir öncekinden büyük olmalı. Sürüm numarası aynı kalabilir (aynı sürümün 2. denemesi), ama build numarası asla tekrar edemez.

```bash
cd ~/Desktop/kelimoli
# Örnek: 1.0.6 (4) → 1.0.7 (5)
sed -i '' 's/MARKETING_VERSION = 1\.0\.6;/MARKETING_VERSION = 1.0.7;/g; s/CURRENT_PROJECT_VERSION = 4;/CURRENT_PROJECT_VERSION = 5;/g' \
  ios/App/App.xcodeproj/project.pbxproj

# Doğrula — 4 satır çıkmalı
grep -E "MARKETING_VERSION|CURRENT_PROJECT_VERSION" ios/App/App.xcodeproj/project.pbxproj
```

Sonra commit'le ve push'la:
```bash
git add -A && git commit -m "chore(ios): sürüm 1.0.7 (5)"
git push origin main
```

⚠️ **Push etmeden CI'yı tetikleme.** CI depodaki `main`'i derler, yerel dosyalarını değil.

---

## Bölüm 2 — Build'i CI'da al

Dağıtım sertifikası **senin Mac'inde yok**, GitHub secrets'ta. Yani App Store'a gidecek build'i yerelde alamazsın; CI alır ve TestFlight'a yükler.

```bash
gh workflow run ios-build.yml -f build_number=5 -f distribution_type=appstore
```

`build_number` değerini yukarıda `CURRENT_PROJECT_VERSION`'a yazdığınla **aynı** ver.

⚠️ `ios-v*` etiketi de workflow'u tetikliyor ama **hiç kullanılmadı** ve build numarasını `github.run_number`'dan alıyor — öngörülemez. Yukarıdaki elle tetikleme yolunda kal.

**İzle:**
```bash
gh run list --workflow=ios-build.yml --limit 3
gh run watch <RUN_ID> --exit-status
```

Yaklaşık **4-5 dakika** sürer. Sonunda log'da şunu görmelisin:
```
UPLOAD SUCCEEDED with no errors
```

Hata alırsan:
```bash
gh run view --log --job=<JOB_ID> | grep -E "^build\t<AdımAdı>" | cut -c1-200
```
Adım adını `gh run view --job=<JOB_ID>` çıktısındaki listeden al. Düz `grep error` yapma — derleyici bayraklarına takılıp binlerce satır döker.

---

## Bölüm 3 — App Store Connect

https://appstoreconnect.apple.com → **My Apps** → **Kelimoli**

Build'in TestFlight'ta görünmesi yüklemeden sonra **10-30 dakika** sürer (Apple "processing" yapar). Aşağıdaki 4. adımda build listede yoksa henüz işlenmemiştir, biraz bekle.

### 1. Yeni sürüm oluştur
Sol menüde iOS App bölümünün yanındaki **"+"** (veya "＋ VERSION OR PLATFORM") → **New Version**.
Sürüm numarasını gir: `1.0.7` — `MARKETING_VERSION` ile aynı olmalı.

### 2. Yenilikler metnini yaz
Yeni açılan **"1.0.7 Prepare for Submission"** sayfasında **"What's New in This Version"** alanı var.
Metinleri `store-listing/` altında sürüm başına tutuyoruz: `TR_whatsnew_<sürüm>.txt`, `EN_whatsnew_<sürüm>.txt`.
Desteklenen her dil için ayrı ayrı yapıştır (sayfanın üstünde dil seçici var).

### 3. Build'i seç
Aynı sayfada aşağı in, **"Build"** bölümü → **"+"** → listeden build numaranı seç.

### 4. Şifreleme sorusu
Build'i seçince **export compliance** sorusu çıkar → **"No"**.
Kelimoli özel şifreleme kullanmıyor, sadece HTTPS. "Yes" dersen ihracat dokümanı ister, gereksiz dert.

### 5. Gönder
**"Add for Review"** → **"Submit for Review"**.

Yayınlama tercihi sorulur:
- **Automatically release** — onaylanır onaylanmaz mağazada
- **Manually release** — onaylandıktan sonra sen düğmeye basana kadar bekler

İnceleme genelde **1-3 gün**.

### Güncellemede GEREKMEYENLER

Bunlar 1.0.5'ten devralınır, dokunma:
- Ekran görüntüleri
- Uygulama açıklaması, anahtar kelimeler, kategori
- Fiyat, yaş sınırı
- Gizlilik beyanı (yeni veri toplamıyorsan)

---

## Bilinmesi gerekenler

**Bundle ID asla değişmez** — `com.kelimoli.app`. Değişirse App Store Connect'teki uygulamayla bağ kopar.

**Web dosyası değiştirdiysen** (`app.js`, `styles.css`, `index.html`, `kelimoli-data.js`...) CI zaten `npm run sync:web && npx cap copy ios` çalıştırıyor, elle bir şey yapman gerekmiyor. Ama **yerel** test build'i alacaksan mutlaka çalıştır, yoksa Xcode eski dosyaları paketler.

**ATT açıklaması** (`NSUserTrackingUsageDescription`, `Info.plist` içinde) silinmemeli. Yoksa Apple build'i alır ama incelemede **kesin reddeder** (Guideline 5.1.2).

**`Podfile.lock` takip edilmiyor.** CI her build'de `pod install --repo-update` çalıştırıp en yeni pod'ları çekiyor. AdMob/UMP hatası buradan çıkmıştı; `scripts/patch-admob.js` UMP **3.x** için yama uyguluyor. UMP 4.x çıkarsa build kırılır ve yamanın güncellenmesi gerekir.

**Android ayrı.** Sürüm numaraları ayrışmış durumda (Android 1.0.19 / iOS 1.0.6) — bu rehber sadece iOS.

---

## Yerelde test build'i (isteğe bağlı)

App Store'a gitmez, ama telefonuna kurup deneyebilirsin. Release yapılandırması normalde dağıtım sertifikası ister; geliştirme sertifikasıyla zorlamak için:

```bash
npm run cap:copy:ios

xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release \
  -destination 'id=CADEE2EA-0C81-53E8-B228-604CA0FBC7AC' \
  -derivedDataPath /tmp/relbuild -allowProvisioningUpdates \
  CODE_SIGN_IDENTITY="Apple Development" CODE_SIGN_STYLE=Automatic \
  PROVISIONING_PROFILE_SPECIFIER="" build

xcrun devicectl device install app --device CADEE2EA-0C81-53E8-B228-604CA0FBC7AC \
  /tmp/relbuild/Build/Products/Release-iphoneos/App.app
```

⚠️ Bu derleme telefondaki **App Store sürümünün üzerine yazar** (aynı bundle ID). Günlük kullanıma dönmek için App Store'dan yeniden yüklemen gerekir.

---

*Not: Apple App Store Connect arayüzünü zaman zaman değiştiriyor; düğme adları birebir tutmayabilir ama sıra aynı kalır. Son güncelleme: 28 Ağustos 2026, sürüm 1.0.6 yayınıyla birlikte yazıldı.*
