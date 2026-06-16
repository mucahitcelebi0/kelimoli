import Capacitor
import WebKit

// Capacitor'ın CAPBridgeViewController'ı için özel WKWebViewConfiguration
// üretiyoruz. İki ayar kritik:
//
// 1) allowsInlineMediaPlayback = true
//    Varsayılan false → WKWebView'da <video playsinline> bile çalışmıyor,
//    YouTube iframe player onError'a düşüyor ve uygulamamız onu YouTube
//    butonlu poster'a çeviriyor. Inline'a izin verince YT player gömülü
//    kalıyor (Sinema Sahnesi UX'i).
//
// 2) mediaTypesRequiringUserActionForPlayback = []
//    Varsayılan .all → JS'ten otomatik oynatma engelleniyor, kullanıcı
//    "Sahneyi izlemek için dokun" placeholder'ında takılıyor. [] olunca
//    ekran açılır açılmaz YT.Player.playVideo() doğrudan başlatabiliyor.
//
// Tarayıcı (localhost) zaten bu davranışı gösteriyor; bu sınıf WKWebView'i
// tarayıcı varsayılanına eşitliyor.
class InlineMediaBridgeViewController: CAPBridgeViewController {
    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let config = super.webViewConfiguration(for: instanceConfiguration)
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        return config
    }
}
