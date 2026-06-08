// =====================================================================
// REVENUECAT CONFIG — Play Billing (abonelik + tek seferlik premium)
// RevenueCat Dashboard → Project Settings → API Keys → "Public app-specific
// API key" (Android, "goog_" ile başlar) buraya yapıştır.
//
// Kurulum adımları (Mücahit yapacak):
// 1. https://app.revenuecat.com → hesap aç → yeni proje "Kelimoli"
// 2. "Apps" → Add app → Google Play → package: com.kelimoli.app
//    → Google Play service account JSON yükle (sunucu doğrulaması için)
// 3. Play Console'da ürünleri oluştur (aşağıdaki ID'lerle BİREBİR):
//      - kelimoli_premium_monthly   (Abonelik)
//      - kelimoli_premium_yearly    (Abonelik)
//      - kelimoli_premium_lifetime  (Uygulama içi ürün / tek seferlik)
// 4. RevenueCat → Products → bu 3 ürünü import et
// 5. RevenueCat → Entitlements → "premium" entitlement oluştur,
//    3 ürünü de bu entitlement'a bağla
// 6. RevenueCat → Offerings → "default" offering, 3 paket ekle
// 7. Project Settings → API Keys → Android public key'i AŞAĞIYA yapıştır
//
// Anahtar boşsa uygulama premium'suz çalışır (satın alma pasif, çökme yok).
// =====================================================================
window.REVENUECAT_CONFIG = {
  // Android "Public app-specific API key" — "goog_..." ile başlar
  androidApiKey: '',

  // Premium erişimi tanımlayan entitlement kimliği (RevenueCat'te oluşturduğun)
  entitlementId: 'premium',
};
