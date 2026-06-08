// =====================================================================
// FIREBASE CONFIG
// Firebase Console → Project Settings → Web App → Config'i buraya yapıştır.
// Config yoksa uygulama tamamen local mode'da çalışır (auth/sync yok).
//
// Adımlar:
// 1. https://console.firebase.google.com → "Add project"
// 2. Proje oluştur (Analytics istersen aç)
// 3. Sol menüden "Build → Authentication" → Get started → "Anonymous" ve
//    "Email/Password" sağlayıcılarını aktif et
// 4. "Build → Firestore Database" → Create → "Start in production mode"
//    → Rules'ı ŞUNA ayarla (DİKKAT: leaderboard verisi
//       leaderboards/{weekId}/entries/{uid} alt koleksiyonunda tutulur,
//       bu yüzden kural da o yolu eşlemeli ve YAZMA izni içermeli):
//       rules_version = '2';
//       service cloud.firestore {
//         match /databases/{database}/documents {
//           match /users/{uid} {
//             allow read, write: if request.auth != null && request.auth.uid == uid;
//           }
//           match /leaderboards/{weekId}/entries/{uid} {
//             allow read:  if request.auth != null;
//             allow write: if request.auth != null && request.auth.uid == uid;
//           }
//         }
//       }
// 5. Project Settings → "Your apps" → Web (</>) ikonu → "Register app"
// 6. Aşağıdaki firebaseConfig nesnesinin içeriğini ORADAN aldığın değerlerle
//    DEĞİŞTİR (apiKey vb.)
// =====================================================================
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCN03lfUHqaV5u5_87wAoEYsiK9djpOSwU",
  authDomain: "kelimoli.firebaseapp.com",
  projectId: "kelimoli",
  storageBucket: "kelimoli.firebasestorage.app",
  messagingSenderId: "452828433988",
  appId: "1:452828433988:web:ae719b0501aebb23afb611",
  measurementId: "G-W08XNKYCMK"
};
