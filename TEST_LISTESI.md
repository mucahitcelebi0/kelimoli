# Kelimoli — Yayın Öncesi Test Kontrol Listesi

> Emulator: Pixel 7 API 35. Her ekranda çalıştır, çakanı `app.js` log + ekran açıklamasıyla bana ilet.
> Test bittikten sonra `_useTestAds = false` ve SW VERSION bump yapılacak.

## 0. Başlangıç (her test turu öncesi)

- [ ] `npm run cap:copy` çalıştırıldı (web → www → android kopyalandı)
- [ ] Android Studio'da `Run ▶` → emulator açıldı
- [ ] **Önemli:** Önceki test verisini sıfırlamak için emulator'da app'i uninstall et veya **Profil → Veri Sıfırla** kullan (varsa)
- [ ] Cihaz internet açık (Firebase + AdMob için)
- [ ] Chrome DevTools `chrome://inspect` ile Console açık — kırmızı hata olursa screenshot

---

## 1. Onboarding & İlk Açılış

- [ ] Splash ekranı görünüyor (logo + arka plan), takılmıyor
- [ ] Onboarding ilk slayt: dil seçimi (A1/A2/B1)
- [ ] İlerleme dot'ları doğru (1/3, 2/3, 3/3)
- [ ] Geri tuşu (Android system back) onboarding'i kapatmıyor — sadece home'a geçtikten sonra çıkış sorulmalı
- [ ] **"Başla"** tuşu → home'a geçiş smooth (animasyon)
- [ ] İlk açılışta XP=0, streak=0, hearts=5 olmalı
- [ ] Onboarding bir kez gösterilip bir daha açılmamalı (localStorage'a bayrak yazılmalı)

## 2. Home Ekranı

- [ ] Üstte: kullanıcı adı (yoksa "Anonim"), XP, streak rozeti
- [ ] **Günlük hedef** çubuğu görünüyor (örn. 30 XP/gün)
- [ ] **Günlük görev kartları** 3 adet, her birinde hedef metni + progress
- [ ] Görevden birine tıkla → ilgili oyun ekranına gidiyor
- [ ] **Hearts** (kalpler) ikonu doğru sayı gösteriyor
- [ ] Alttaki **AdMob banner** görünüyor (test reklam yazısıyla)
- [ ] Banner reklam home dışında oyun ekranlarında **gizli** mi?
- [ ] **Profile** ikonuna tıkla → profile ekranı

## 3. Games (Oyun Menüsü)

- [ ] 7+ oyun kartı listeleniyor: Quiz, Match, Flash, Listen, Movie, False Friends, Mistakes, Stories
- [ ] Her kartta: ikon + isim + kısa açıklama
- [ ] Kilit ikonu olan oyunlar (Premium) varsa, basınca paywall açılıyor mu?
- [ ] Geri tuşu home'a dönüyor

## 4. Quiz Modu

- [ ] Soru çıkıyor (Türkçe), 4 İngilizce şık
- [ ] Doğru cevap: yeşil, haptic light, ses (yumuşak)
- [ ] Yanlış cevap: kırmızı, haptic medium, ses (uyarı)
- [ ] **Hearts** azalıyor mu yanlışta?
- [ ] 10 soruda bir **interstitial reklam** geliyor mu? (test ad)
- [ ] Soru bitince **özet ekranı**: doğru/yanlış sayısı, kazanılan XP
- [ ] **"Tekrar"** ve **"Çık"** butonları çalışıyor mu?
- [ ] Hatalı sorular **mistakes** listesine ekleniyor mu? (kontrol: 5 yanlış yap, sonra mistakes'e bak)

## 5. Match (Eşleştirme)

- [ ] 6 TR + 6 EN karışık çıkıyor
- [ ] Bir TR'ye, bir EN'ye dokun → eşleşirse yeşil + ses
- [ ] Yanlış eşleşme → kısa kırmızı flash
- [ ] Tüm 6 eşleşince **tebrik animasyonu**
- [ ] Süre/skor doğru hesaplanıyor mu?
- [ ] XP eklenince home'da güncelleniyor mu? (oyundan çıkıp home'a bak)

## 6. Flash Cards

- [ ] Kart Türkçe gösterip, tap'le İngilizce'ye dönüyor
- [ ] Kart altında **"Biliyorum / Tekrar"** butonları
- [ ] **SM-2 SRS**: "tekrar" dediğin kelime kısa süre sonra geri gelmeli, "biliyorum" dediğin uzun süre sonra
- [ ] Bittiğinde özet
- [ ] Tap çift kayıt etmiyor mu? (debounce çalışıyor mu)

## 7. Dinle & Yaz (Listen)

- [ ] **Web Speech API** ile İngilizce telaffuz çalıyor
- [ ] Ses çıkmazsa: emulator'da Settings → Sound aç
- [ ] Kullanıcı yazıyor, **Levenshtein toleransı** çalışıyor (1-2 harf hata kabul edilmeli)
- [ ] Boşluk/büyük harf farkı affediliyor mu?
- [ ] "Tekrar dinle" butonu sınırsız mı?

## 8. Movie Modu

- [ ] İngilizce cümle + boşluk doldurma
- [ ] İpucu sistemi (varsa) çalışıyor
- [ ] Doğru cümle → bonus XP

## 9. False Friends

- [ ] 30 yanıltıcı kelime kartı (örn. `actually ≠ aktüel`)
- [ ] Tap'le doğru anlam açıklaması
- [ ] **TR öğrenciye özgü USP** çalışıyor (Türk'e tuzak kuran kelimeler vurgulanmış mı?)

## 10. Mistakes (Hatalar)

- [ ] Quiz'de yanlış yaptığın kelimeler listeleniyor mu?
- [ ] Listeden bir kelimeyi seçince mini-quiz açılıyor mu?
- [ ] Doğru cevap verince **listeden çıkıyor** mu?

## 11. Stories (Hikayeler)

- [ ] 5 senaryo görünüyor: Kahve, Havalimanı, Mülakat, Doktor, Yol
- [ ] Birini seç → diyalog akışı başlıyor
- [ ] Her replikte İngilizce + tap'le Türkçe çevirisi
- [ ] Hikaye bitince **rozet/XP** ödülü
- [ ] Tamamlanan hikaye **storiesCompleted** flag'i ile kilitleniyor (tekrar oynayabilse de "tamamlandı" göstergesi)

## 12. Leaderboard (Lig)

- [ ] Banner home'da görünüyor (lig + sıra)
- [ ] Tap → leaderboard ekranı
- [ ] **Top 30** liste, sen kendi sıranı görüyor musun?
- [ ] Lig rozeti: Bronz / Gümüş / Altın / Elmas — XP'ye göre doğru mu?
- [ ] **Haftalık XP** sıfırlandığında bir sonraki pazartesi yeni hafta başlıyor mu? (emulator tarihini değiştirip test edebilirsin)
- [ ] Firestore'da `leaderboards/{weekId}/entries/{uid}` doc'u oluştu mu? (Firebase Console)

## 13. Profile

- [ ] Kullanıcı adı düzenlenebiliyor
- [ ] Seviye (A1/A2/B1) değiştirilebiliyor
- [ ] **Hesap kartı**: Email + "Çıkış yap" butonu
- [ ] **Rozet ızgarası**: 21 rozet, kilidi açık olanlar parlak, kilitli olanlar gri
- [ ] Rozet tap → açıklama popup'ı
- [ ] **Dark mode toggle** çalışıyor mu? (her ekranda renkler doğru)
- [ ] **Ses açma/kapama** toggle çalışıyor mu?
- [ ] **Bildirim izni** istemesi (Local Notifications) test et
- [ ] **Veri Sıfırla** (varsa) onay popup'ı + gerçekten sıfırlıyor mu?

## 14. Paywall (Premium)

- [ ] Kilitli oyuna tıklayınca açılıyor
- [ ] 3 plan kartı (haftalık / aylık / yıllık) görünüyor
- [ ] **Dev-test backdoor:** 👑 ikonuna 5 tıkla → premium açılıyor mu?
- [ ] Premium açıldıktan sonra reklamlar **gizleniyor** mu? (home banner + interstitial)
- [ ] Premium kilitli oyunlar açılıyor mu?

## 15. Rozet Sistemi

- [ ] İlk dersi bitir → "İlk Adım" rozeti popup
- [ ] 7 günlük seri → streak rozeti
- [ ] 100 kelime → kelime rozeti
- [ ] Popup animasyonu + ses + haptic
- [ ] Tüm 21 rozet için tetik koşullarını gözden geçir (`app.js` içinde `unlockBadge`)

## 16. Dark Mode

- [ ] Profile → toggle aç
- [ ] **Tüm 15 ekran** dark mode renkleri doğru (siyah arka plan, beyaz metin, kontrastlı buton)
- [ ] Kart kenarlıkları görünüyor, metin okunaklı
- [ ] AdMob banner dark mode'da çirkin görünmüyor mu?
- [ ] Geri light mode'a → tüm renkler eski haline döndü

## 17. Bildirimler (Local Notifications)

- [ ] App'i kapat (background)
- [ ] Bir gün sonrası (test için 1 dakika sonra programlanmış bildirim varsa) bildirim geldi mi?
- [ ] Bildirime tap → app açılıyor, doğru ekrana gidiyor

## 18. Firebase / Cloud Sync

- [ ] Login ol (Profile → Hesap → Giriş)
- [ ] XP kazan, app'i kapat
- [ ] Emulator app'i tamamen kapatıp tekrar aç → XP geri yüklendi mi?
- [ ] **Çıkış yap → yeni hesapla giriş** → eski XP/streak gelmedi (yeni hesap temiz)
- [ ] **Anonymous → Email upgrade**: Anonim oynadıktan sonra hesap aç → veriler taşındı mı?

## 19. AdMob (Test Mode)

- [ ] Home alt banner: "Test Ad" yazısı görünüyor
- [ ] Quiz/Match arasında interstitial: "Test Ad" görünüyor, 5 sn sonra kapatılabiliyor
- [ ] Reklam yüklenmezse fallback (boşluk yerine ekran kayması yok)
- [ ] **Sıklık:** Çok sık interstitial gelmiyor (10 oyunda 1 gibi makul mü?)

## 20. Performans & Kararlılık

- [ ] App açılış süresi < 3 saniye
- [ ] Oyun ekranları arası geçiş takılmıyor
- [ ] 30 dakika sürekli oyun → çökme/yavaşlama yok
- [ ] Telefon döndürme (rotate) → ekran kırılmıyor
- [ ] Android **back tuşu** her ekranda mantıklı davranıyor (Home'dan back → çıkış onayı)
- [ ] Service Worker doğru sürüm (DevTools → Application → SW)

## 21. Edge Case'ler

- [ ] **İnternet kapalı** → leaderboard "Çevrimdışı" mesajı, oyunlar yine çalışıyor mu? (offline play)
- [ ] **Aynı anda 2 ekran arası hızlı geçiş** → çakışma var mı?
- [ ] Kullanıcı adına emoji/Çince karakter koy → kırılıyor mu?
- [ ] Çok uzun isim (50 karakter) leaderboard'da taşıyor mu?
- [ ] **0 hearts** durumunda quiz'e girince ne oluyor? (kapanmalı veya reklam izle → can kazan akışı)

---

## Test Sonrası Yapılacaklar (yayından önce)

- [ ] `firebase-sync.js` veya `app.js` içinde `_useTestAds = true` → **`false`**
- [ ] `sw.js` içinde `VERSION` bump (v7 → v8)
- [ ] `console.log` debug satırlarını comment/sil
- [ ] AndroidManifest → `android:allowBackup="false"` (güvenlik için)
- [ ] `versionCode` ve `versionName` bump (`android/app/build.gradle`)
- [ ] Signed Release APK / AAB build

---

## Bug Bildirim Formatı

Buraya yaz:

```
Ekran: [hangi ekran]
Adım: [ne yaptın]
Beklenen: [ne olmalıydı]
Olan: [ne oldu]
Console hatası: [varsa kopyala]
```

Ben okur okumaz ilgili dosyada fix önereyim.
