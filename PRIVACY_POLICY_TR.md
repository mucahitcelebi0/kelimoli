# Kelimoli — Gizlilik Politikası

**Son güncelleme:** 26 Mayıs 2026
**Geliştirici:** Muhammet Mücahit Çelebi
**İletişim:** fsamibilgin@gmail.com
**Uygulama:** Kelimoli — İngilizce Kelime Akademisi
**Paket adı:** com.kelimoli.app

---

## 1. Genel Bakış

Kelimoli ("Uygulama"), İngilizce kelime öğrenmek için tasarlanmış bir mobil uygulamadır. Bu Gizlilik Politikası, Uygulama'yı kullandığınızda hangi bilgilerin toplandığını, nasıl kullanıldığını ve haklarınızı açıklar.

Uygulamayı kullanarak bu politikayı kabul etmiş sayılırsınız.

---

## 2. Topladığımız Bilgiler

### 2.1 Sizin Doğrudan Sağladığınız Bilgiler

| Bilgi | Nerede toplanır | Amaç |
|---|---|---|
| E-posta adresi | Hesap oluşturma (isteğe bağlı) | Hesap kimliği, oturum açma |
| Şifre | Hesap oluşturma (isteğe bağlı) | Firebase Authentication tarafından şifrelenir; bizim sunucumuza ulaşmaz |
| Kullanıcı adı (takma ad) | Profil | Liderlik tablosunda görünüm |
| Seviye seçimi (Başlangıç/A1/A2/B1/B2) | Onboarding | Kelime havuzunun seviyenize uyarlanması |

**Anonim Kullanım:** Hesap oluşturmadan da Uygulamayı kullanabilirsiniz. Bu durumda yalnızca anonim bir kimlik (UID) oluşturulur, kişisel veri toplanmaz.

### 2.2 Otomatik Olarak Toplanan Bilgiler

| Bilgi | Toplayan | Amaç |
|---|---|---|
| Oyun istatistikleri (XP, streak, doğru/yanlış cevaplar, kelime ilerlemesi) | Firebase Firestore | İlerlemenizi cihazlar arası senkronize etmek |
| Rozetler, tamamlanan hikayeler | Firebase Firestore | Kullanıcı profili |
| Haftalık XP ve lig sıralaması | Firebase Firestore | Liderlik tablosu |
| Reklam kimliği (AAID) | Google AdMob | Reklam gösterimi, dolandırıcılık önleme |
| Cihaz türü, işletim sistemi sürümü, uygulama sürümü | Firebase Analytics | Anonim kullanım istatistikleri |
| Olay verileri (hangi ekran açıldı, hangi oyun oynandı) | Firebase Analytics | Uygulama iyileştirme |

### 2.3 Toplamadığımız Bilgiler

- Gerçek adınız, doğum tarihiniz, telefon numaranız
- Konum bilgisi (GPS, IP konumu)
- Kişiler, fotoğraflar, mikrofon kayıtları
- Tarayıcı geçmişi veya diğer uygulamalardaki etkinliğiniz

---

## 3. Üçüncü Taraf Hizmetler

Kelimoli aşağıdaki hizmetleri kullanır. Her birinin kendi gizlilik politikası vardır.

### 3.1 Google Firebase (Auth, Firestore, Analytics)
- **Amaç:** Hesap yönetimi, veri senkronizasyonu, liderlik tablosu, kullanım analizi.
- **Veri konumu:** Google sunucuları (AB/ABD).
- **Politika:** https://firebase.google.com/support/privacy

### 3.2 Google AdMob
- **Amaç:** Uygulama içi reklam gösterimi (banner + ara reklam).
- **Veri:** AAID (reklam kimliği), cihaz türü, ağ bilgisi.
- **Kişiselleştirilmiş Reklam:** Cihaz ayarlarınızdan "Reklam Kimliğini Sıfırla" / "Reklam Kişiselleştirmesini Kapat" ile devre dışı bırakabilirsiniz.
- **Politika:** https://policies.google.com/technologies/ads

### 3.3 Capacitor Yerel Bildirim
- **Amaç:** Günlük hatırlatma bildirimleri.
- Bildirim izni cihazınızda istenir; reddedebilirsiniz.

---

## 4. Bilgilerinizi Nasıl Kullanırız

- **Uygulamayı çalıştırmak** — oturum açma, ilerleme kaydı.
- **Kişiselleştirme** — seviyenize uygun kelime önerme, liderlik tablosu.
- **İletişim** — uygulama içi hata bildirimleri (sizden talep etmediğimiz e-posta göndermeyiz).
- **Uygulama geliştirme** — anonim kullanım istatistikleri.
- **Reklam** — ücretsiz sürümde reklam gösterimi.

**Sattığımız Hiçbir Şey Yok.** Verilerinizi üçüncü taraflara satmayız, kiralamayız veya pazarlama amaçlı paylaşmayız.

---

## 5. Veri Saklama

- Hesap verileriniz, hesabınız silinene kadar saklanır.
- Anonim oturum verileri 12 ay boyunca saklanır.
- Hesabınızı silmek için **fsamibilgin@gmail.com** adresine "Hesap silme talebi" konulu e-posta atın. 30 gün içinde tüm verileriniz silinir.

---

## 6. Haklarınız (KVKK / GDPR)

Şu haklara sahipsiniz:
- **Erişim:** Hangi verilerin saklandığını öğrenme.
- **Düzeltme:** Yanlış verilerin düzeltilmesi.
- **Silme:** Verilerinizin silinmesini talep etme.
- **İtiraz:** Veri işlemeye itiraz etme.
- **Veri Taşıma:** Verilerinizin makine okunabilir formatta verilmesi.

Talepleriniz için: **fsamibilgin@gmail.com**

---

## 7. Çocukların Gizliliği

Kelimoli **13 yaş ve üzeri** kullanıcılar için tasarlanmıştır. 13 yaşından küçük olduğunu öğrendiğimiz kullanıcıların hesaplarını sileriz. Çocuğunuzun bilgilerini sehven sağladığını düşünüyorsanız bize ulaşın.

---

## 8. Güvenlik

- Şifreler Firebase Authentication tarafından sektör standartlarında şifrelenir.
- Veri iletimi HTTPS/TLS ile şifrelenir.
- Firestore güvenlik kuralları, kullanıcıların yalnızca kendi verilerini okumasına izin verir.

Bununla birlikte, hiçbir sistem %100 güvenli değildir; gerekli tüm makul önlemleri alırız.

---

## 9. Değişiklikler

Bu politikada değişiklik yaparsak, "Son güncelleme" tarihini güncelleriz ve önemli değişiklikleri uygulama içinde bildiririz.

---

## 10. İletişim

**E-posta:** fsamibilgin@gmail.com

Bu politika hakkında sorularınız için bize her zaman ulaşabilirsiniz.
