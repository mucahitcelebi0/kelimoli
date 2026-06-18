// =====================================================================
// Kelimoli — Firebase Auth + Cloud Sync + Analytics
// Modüler Firebase v10 SDK'sı (CDN üzerinden ES module import).
// Config yoksa graceful fallback: hiçbir şey yapmadan local-only çalışır.
// Çıkış noktası: window.Cloud (init, signIn, signOut, sync, pull, currentUser, ...)
// =====================================================================

const Cloud = (() => {
  let _ready = false;
  let _initPromise = null;
  let _app = null;
  let _auth = null;
  let _db = null;
  let _analytics = null;
  let _user = null;
  let _saveTimer = null;
  // Bir önceki oturum açmış kullanıcının uid'i — auth state değişimini güvenle
  // yakalamak için. signOut sırasında newUid=null olur ama bu DEĞİŞKEN sıfırlanmaz;
  // sadece YENİ bir non-null user geldiğinde güncellenir. Böylece signOut→signIn
  // (farklı hesap) akışı tek atlamada yakalanır.
  let _lastUserUid = null;
  const _listeners = new Set(); // auth state change callbacks

  // Firebase modülleri dinamik import — sadece config varsa yüklenir.
  let _fb = null;

  async function init() {
    if (_ready) return true;
    // Eşzamanlı init çağrılarını tek promise altında topla — birden çok yer
    // (app boot + auth modal click) aynı anda tetiklerse double initializeApp olmaz.
    if (_initPromise) return _initPromise;
    // Savunma katmanı: init() içindeki adımlardan biri (bilinmeyen bir SDK çağrısı,
    // gelecekte eklenecek bir adım) timeout'suz asılı kalırsa init() artık SONSUZA
    // DEK beklemiyor — 12sn'de false döner, _initPromise sıfırlanır, kullanıcı
    // tekrar denediğinde yeni bir deneme şansı olur. Asıl iş hâlâ arka planda
    // sürer ama UI onu beklemekten vazgeçer (diğer Promise.race'lerle aynı desen).
    _initPromise = Promise.race([
      (async () => {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || cfg.apiKey.startsWith('AIzaXXX')) {
      console.info('[Kelimoli] Firebase config eklenmemiş — local-only modda.');
      return false;
    }
    try {
      // Firebase SDK'sı uygulamayla bundle'lanmış (firebase-bundle.js). CDN bağımlılığı yok —
      // iOS'ta gstatic.com'a istek atmadan offline da init olur. Bundle yüklenmediyse
      // graceful fallback: local-only mode.
      if (!window.FirebaseBundle) {
        console.warn('[Kelimoli] FirebaseBundle yüklenmemiş — local-only modda.');
        return false;
      }
      const { initializeApp, authMod, firestoreMod, analyticsMod } = window.FirebaseBundle;

      _app = initializeApp(cfg);
      _auth = authMod.getAuth(_app);

      // KRİTİK: Auth persistence'ı LOCAL (kalıcı) yap. Varsayılan SESSION'da
      // uygulama/WebView kapanınca kullanıcı düşüyor. browserLocalPersistence
      // IndexedDB kullanır, app kapansa veya cihaz yeniden başlasa bile korunur.
      // setPersistence çağrısı onAuthStateChanged kurulumundan ÖNCE bitmeli.
      // 5sn timeout — bu çağrı diğerleri gibi (signIn/signUp/signInAnonymously)
      // hang koruması olmadan tek kalmıştı: iOS WKWebView'da bazı ağ koşullarında
      // hiç resolve/reject olmadan asılı kalabiliyor, bu da Cloud.init()'i ve
      // dolayısıyla _ready=true'yu sonsuza dek bloke ediyordu ("Sunucuya
      // bağlanılamadı" hatası 15sn retry'dan SONRA bile devam ediyordu).
      // 1.5sn timeout — debug'da her iki deneme de 5sn bekliyordu (5+5=10sn),
      // outer 12sn timeout'tan önce _ready=true'ya ulaşılamıyordu. 1.5sn ile
      // toplam < 4sn, 12sn window'u rahatça geçiyoruz.
      const withPersistTimeout = (p) => Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error('setPersistence timeout')), 1500))
      ]);
      try {
        await withPersistTimeout(authMod.setPersistence(_auth, authMod.browserLocalPersistence));
      } catch (e) {
        // indexedLocalPersistence (Capacitor WebView için daha sağlam) fallback
        try {
          await withPersistTimeout(authMod.setPersistence(_auth, authMod.indexedDBLocalPersistence));
        } catch (e2) {
          console.warn('[Kelimoli] Auth persistence ayarlanamadı (sessizce devam):', e.code || e.message || e2.message);
        }
      }

      // Offline persistence: kullanıcı internetsizken bile son state'i görür,
      // bağlantı dönünce otomatik sync olur. initializeFirestore getFirestore'dan
      // ÖNCE çağrılmalı. Capacitor tek WebView olduğundan SingleTabManager yeterli.
      try {
        _db = firestoreMod.initializeFirestore(_app, {
          localCache: firestoreMod.persistentLocalCache({
            tabManager: firestoreMod.persistentSingleTabManager(),
          }),
        });
      } catch (e) {
        // Bazı senaryolarda initializeFirestore tekrar çağrılırsa atar — fallback
        _db = firestoreMod.getFirestore(_app);
      }
      _fb   = { authMod, firestoreMod };

      if (analyticsMod && cfg.measurementId) {
        try { _analytics = analyticsMod.getAnalytics(_app); } catch (e) {}
      }

      // Auth state takibi — kullanıcı değişiminde local progress'i ZORLA SIFIRLA.
      // (ownerUid tabanlı kontrol pullAndMerge içinde de var, bu birinci savunma katmanı.)
      authMod.onAuthStateChanged(_auth, async (user) => {
        const prevUid = _lastUserUid;
        const newUid = user ? user.uid : null;
        _user = user;
        // Auth gerçekten BAŞKA bir kullanıcıya geçtiyse (signOut → null geçişi değil),
        // local progress'i hemen sıfırla — eski hesabın XP/streak/görevleri yeni hesapta sızmasın.
        if (newUid && prevUid && prevUid !== newUid) {
          console.info('[Kelimoli] Auth değişti:', prevUid, '→', newUid, '— local progress sıfırlanıyor.');
          wipeLocalProgress();
          saveStore();
          _refreshAllUI();
        }
        // _lastUserUid sadece non-null user'ları kaydeder; signOut state'i (null) saklanmaz
        // ki sonraki signIn'de uid karşılaştırması doğru çalışsın.
        if (newUid) _lastUserUid = newUid;
        if (user) {
          // Login olduğunda bulutu çek, local ile birleştir
          await pullAndMerge();
        }
        _listeners.forEach(fn => { try { fn(user); } catch (e) {} });
      });

      // _ready burada set edilir — signInAnonymously ağ çağrısı ÖNCE değil.
      // Sebep: setPersistence (2×5sn) + signInAnonymously (5sn) = 15sn >
      // outer 12sn timeout → _ready asla true olmuyordu. Anonim giriş
      // fire-and-forget olarak arka planda devam eder; email/password login
      // etkilenmez çünkü _auth zaten hazır.
      _ready = true;

      if (!_auth.currentUser) {
        authMod.signInAnonymously(_auth).catch(e => {
          console.warn('[Kelimoli] Anonim giriş başarısız:', e.code || e.message);
        });
      }
      return true;
    } catch (e) {
      console.error('[Kelimoli] Firebase init başarısız:', e);
      return false;
    }
      })(),
      new Promise((resolve) => setTimeout(() => {
        console.warn('[Kelimoli] Cloud.init() 12sn içinde tamamlanmadı — local-only modda devam.');
        resolve(false);
      }, 12000)),
    ]);
    const result = await _initPromise;
    if (!result) _initPromise = null;   // başarısızsa retry yapılabilsin
    return result;
  }

  function onAuthStateChange(fn) {
    _listeners.add(fn);
    if (_user) { try { fn(_user); } catch (e) {} }
    return () => _listeners.delete(fn);
  }

  function currentUser() { return _user; }
  function isReady()     { return _ready; }
  function isAnonymous() { return _user ? _user.isAnonymous : false; }

  // Email/password ile yeni hesap — anonim hesabı linkler (veri kaybolmaz)
  async function signUpWithEmail(email, password) {
    if (!_ready) throw new Error('Cloud hazır değil');
    const { EmailAuthProvider, linkWithCredential, createUserWithEmailAndPassword } = _fb.authMod;
    // 20sn timeout — iPadOS 26.5 + Firebase Auth REST API hang koruması.
    // Timeout durumunda kullanıcı 'İnternet bağlantısı yok.' hatası görür, infinite loading değil.
    const withTimeout = (promise) => Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => {
        const err = new Error('Sign-up timeout');
        err.code = 'auth/network-request-failed';
        reject(err);
      }, 20000))
    ]);
    if (_user && _user.isAnonymous) {
      // Anonim hesabı email/password'a yükselt — XP, streak, vs. korunur
      const cred = EmailAuthProvider.credential(email, password);
      const result = await withTimeout(linkWithCredential(_user, cred));
      _user = result.user;
      return result.user;
    }
    const result = await withTimeout(createUserWithEmailAndPassword(_auth, email, password));
    _user = result.user;
    return result.user;
  }

  async function signInWithEmail(email, password) {
    if (!_ready) throw new Error('Cloud hazır değil');
    // Hesap değişiminden ÖNCE mevcut kullanıcının (misafir/anonim) verisini buluta yaz
    // ki senkronize olmamış son ilerleme (görevler dahil) kaybolmasın.
    // KRİTİK: Apple Review reject 12 Haz 2026 — login indefinite loading sebebi
    // flushSync iPad iOS 26.5'te bazen resolve etmiyor (network/Firestore hang).
    // Promise.race ile 3sn timeout → sign-in akışı bloke edilmez.
    try {
      await Promise.race([
        flushSync(),
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);
    } catch (e) {}
    const { signInWithEmailAndPassword } = _fb.authMod;
    // 20sn timeout — Firebase Auth REST API hang koruması (Apple Review reject 12 Haz).
    const result = await Promise.race([
      signInWithEmailAndPassword(_auth, email, password),
      new Promise((_, reject) => setTimeout(() => {
        const err = new Error('Sign-in timeout');
        err.code = 'auth/network-request-failed';
        reject(err);
      }, 20000))
    ]);
    _user = result.user;
    return result.user;
  }

  // Şifre sıfırlama e-postası gönder. 20sn timeout — hang olmasın.
  async function sendPasswordReset(email) {
    if (!_ready) throw new Error('Cloud hazır değil');
    const { sendPasswordResetEmail } = _fb.authMod;
    return Promise.race([
      sendPasswordResetEmail(_auth, email),
      new Promise((_, reject) => setTimeout(() => {
        const err = new Error('Password reset timeout');
        err.code = 'auth/network-request-failed';
        reject(err);
      }, 20000))
    ]);
  }

  async function signOut() {
    if (!_ready) return;
    // Çıkıştan ÖNCE mevcut hesabın verisini buluta yaz (kayıp olmasın)
    try { await flushSync(); } catch (e) {}
    await _fb.authMod.signOut(_auth);
    _user = null;
    // Local progress'i HEMEN sıfırla — yeni anonim user gelmeden UI 65 XP göstermesin.
    // (Auth listener da yakalayacak ama burada anında yapmak daha kararlı bir UX verir.)
    wipeLocalProgress();
    saveStore();
    _refreshAllUI();
    // Çıkıştan sonra misafir (anonim) moda dön — UI "Bağlanıyor…"da takılmasın
    try {
      const result = await _fb.authMod.signInAnonymously(_auth);
      _user = result.user;
    } catch (e) {
      console.warn('[Kelimoli] Çıkış sonrası anonim giriş başarısız:', e.code || e.message);
    }
  }

  // ----- Firestore: store senkronizasyonu -----
  function userDoc() {
    if (!_user || !_db) return null;
    const { doc } = _fb.firestoreMod;
    return doc(_db, 'users', _user.uid);
  }

  // Local store'u buluta yaz (debounce'lu)
  function scheduleSync() {
    if (!_ready || !_user) return;
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => syncNow().catch(() => {}), 2000);
  }
  // Bekleyen debounce'u iptal edip HEMEN yaz (uygulama arka plana atılınca)
  function flushSync() {
    clearTimeout(_saveTimer);
    return syncNow().catch(() => false);
  }

  async function syncNow() {
    if (!_ready || !_user) return false;
    const ref = userDoc();
    if (!ref) return false;
    const { setDoc, serverTimestamp } = _fb.firestoreMod;
    const payload = {
      xp: store.xp,
      streak: store.streak,
      hearts: store.hearts,
      lastActiveDate: store.lastActiveDate,
      dailyGoal: store.dailyGoal,
      totalCorrect: store.totalCorrect,
      totalAnswered: store.totalAnswered,
      weeklyXp: store.weeklyXp || 0,
      weekId: store.weekId || null,
      onboarded: !!store.onboarded,
      wordStats: store.wordStats || {},
      achievements: store.achievements || { unlocked: [] },
      counters: store.counters || {},
      storiesCompleted: store.storiesCompleted || {},
      quests: store.quests || null,   // günün görevleri + ilerlemesi — hesaba özel
      user: store.user || {},
      updatedAt: serverTimestamp(),
    };
    try {
      // 8sn timeout — Firestore write hang koruması (iPadOS 26.5 network).
      await Promise.race([
        setDoc(ref, payload, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('syncNow timeout')), 8000))
      ]);
      return true;
    } catch (e) {
      console.warn('[Kelimoli] Cloud sync hatası:', e.code || e.message);
      return false;
    }
  }

  // Kullanıcı değiştiğinde (misafir → giriş, hesap1 → hesap2) local ilerlemeyi sıfırla.
  // Cihaz tercihleri (tema, ses, haptic, bildirim) korunur — bunlar cihaz bazlı.
  function wipeLocalProgress() {
    store.xp = 0;
    store.streak = 0;
    store.hearts = 5;
    store.heartsUpdatedAt = null;
    store.lastActiveDate = null;
    store.todayDate = null;
    store.todayAnswered = 0;
    store.dailyGoal = 10;
    store.totalCorrect = 0;
    store.totalAnswered = 0;
    store.weeklyXp = 0;
    store.weekId = null;
    store.wordStats = {};
    store.achievements = { unlocked: [], seen: [] };
    store.counters = {};
    store.storiesCompleted = {};
    store.quests = null;          // günün görevleri + ilerlemesi hesaba özel — sıfırla
    store.user = { name: '', reason: '', level: 'A1' };
    store.onboarded = false;
  }

  // Bir görev setinin toplam ilerlemesi — hangi tarafın daha güncel olduğunu kıyaslamak için.
  // Tamamlanan görevler ağır basar (her biri büyük ağırlık), sonra ham ilerleme sayaçları.
  function _questProgressSum(q) {
    if (!q || !q.progress) return -1;
    let sum = 0;
    for (const v of Object.values(q.progress)) sum += (v || 0);
    if (Array.isArray(q.list)) sum += q.list.filter(i => i && i.claimed).length * 100000;
    return sum;
  }

  // Bugünün tarihi (app.js'deki todayStr ile aynı format). app.js yüklenmemişse güvenli fallback.
  function _today() {
    try { if (typeof todayStr === 'function') return todayStr(); } catch (e) {}
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // Görevleri hesaba özel ve kayıpsız birleştir.
  //  - Geçerli = bugüne ait VE sahibi (owner) bu kullanıcı (eski quests'te owner olmayabilir → kabul).
  //  - İki taraf da geçerliyse: daha çok ilerlemiş olanı al (kayıp olmaz).
  //  - Sadece biri geçerliyse onu al. Hiçbiri değilse null → rollDailyQuests bugünün setini üretir.
  function _mergeQuests(localQ, remoteQ, uid) {
    const today = _today();
    const valid = (q) => q && q.date === today && (!q.owner || q.owner === uid);
    const lOk = valid(localQ), rOk = valid(remoteQ);
    if (lOk && rOk) return _questProgressSum(localQ) >= _questProgressSum(remoteQ) ? localQ : remoteQ;
    if (rOk) return remoteQ;
    if (lOk) return localQ;
    return null;
  }

  // Veri yeniden yüklendiğinde (login/logout/hesap değişimi) tüm görünümleri tazele.
  // refreshStats sadece sayısal verileri günceller; isim, rozet ve görevler ayrı.
  function _refreshAllUI() {
    try { if (typeof refreshStats === 'function') refreshStats(); } catch (e) {}
    try { if (typeof applyUserToUI === 'function') applyUserToUI(); } catch (e) {}
    try { if (typeof renderAchievementsList === 'function') renderAchievementsList(); } catch (e) {}
    try { if (typeof renderQuests === 'function') renderQuests(); } catch (e) {}
    try { if (typeof renderProfileLevel === 'function') renderProfileLevel(); } catch (e) {}
    try { if (typeof refreshLeaderboardBanner === 'function') refreshLeaderboardBanner(); } catch (e) {}
  }

  // Buluttan çek ve local ile birleştir — daha yüksek değeri al (XP, streak, vs.)
  async function pullAndMerge() {
    if (!_ready || !_user) return false;
    const ref = userDoc();
    if (!ref) return false;
    const { getDoc } = _fb.firestoreMod;

    // BUG FIX: Eğer local store'un sahibi farklı bir kullanıcıysa (örn. misafirken
    // oynayıp sonra başka hesaba giriş), local progress'i sıfırla. Aksi halde
    // Math.max merge mantığı eski kullanıcının yüksek değerlerini yeni hesaba taşır.
    const prevOwner = store.ownerUid || null;
    const currentUid = _user.uid;
    const userChanged = prevOwner && prevOwner !== currentUid;
    if (userChanged) {
      console.info('[Kelimoli] Kullanıcı değişti, local progress sıfırlanıyor.');
      wipeLocalProgress();
    }

    try {
      // 8sn timeout — Firestore read hang koruması (iPadOS 26.5 network).
      const snap = await Promise.race([
        getDoc(ref),
        new Promise((_, reject) => setTimeout(() => reject(new Error('pullAndMerge timeout')), 8000))
      ]);
      if (!snap.exists()) {
        // Cihaz yeni — local'i buluta yükle (kullanıcı değiştiyse de wipe sonrası boş yüklenir)
        store.ownerUid = currentUid;
        saveStore();
        _refreshAllUI();
        await syncNow();
        return true;
      }
      const remote = snap.data();
      // Sayısal alanlar: max al (yeni cihazda da kaybolmasın)
      store.xp           = Math.max(store.xp || 0, remote.xp || 0);
      store.streak       = Math.max(store.streak || 0, remote.streak || 0);
      store.totalCorrect = Math.max(store.totalCorrect || 0, remote.totalCorrect || 0);
      store.totalAnswered= Math.max(store.totalAnswered || 0, remote.totalAnswered || 0);
      store.lastActiveDate = remote.lastActiveDate || store.lastActiveDate;
      if (remote.dailyGoal) store.dailyGoal = remote.dailyGoal;

      // Haftalık XP — yalnız aynı hafta ise birleştir (eski hafta taşınmasın)
      try { if (typeof rollWeeklyCounter === 'function') rollWeeklyCounter(); } catch (e) {}
      if (remote.weekId && remote.weekId === store.weekId) {
        store.weeklyXp = Math.max(store.weeklyXp || 0, remote.weeklyXp || 0);
      }
      // Onboarding bir cihazda tamamlandıysa diğerinde tekrar sorma
      if (remote.onboarded) store.onboarded = true;

      // wordStats: kelime bazında max correct/wrong (kaybolmasın)
      const merged = { ...(remote.wordStats || {}) };
      const local = store.wordStats || {};
      for (const k of Object.keys(local)) {
        const r = merged[k] || { correct: 0, wrong: 0, lastSeen: 0 };
        merged[k] = {
          correct: Math.max(r.correct || 0, local[k].correct || 0),
          wrong:   Math.max(r.wrong || 0, local[k].wrong || 0),
          lastSeen: Math.max(r.lastSeen || 0, local[k].lastSeen || 0),
          // SM-2 alanları: en güncel olanı al
          ef: (local[k].lastSeen || 0) > (r.lastSeen || 0) ? local[k].ef : r.ef,
          interval: (local[k].lastSeen || 0) > (r.lastSeen || 0) ? local[k].interval : r.interval,
          rep: (local[k].lastSeen || 0) > (r.lastSeen || 0) ? local[k].rep : r.rep,
          due: (local[k].lastSeen || 0) > (r.lastSeen || 0) ? local[k].due : r.due,
        };
      }
      store.wordStats = merged;

      // Rozetler: birleşim (unlocked listeleri merge)
      const localAch = new Set(store.achievements?.unlocked || []);
      const remoteAch = remote.achievements?.unlocked || [];
      remoteAch.forEach(id => localAch.add(id));
      store.achievements = { unlocked: [...localAch], seen: store.achievements?.seen || [] };

      // Sayaçlar: max al
      const lc = store.counters || {};
      const rc = remote.counters || {};
      const allKeys = new Set([...Object.keys(lc), ...Object.keys(rc)]);
      const mc = {};
      allKeys.forEach(k => { mc[k] = Math.max(lc[k] || 0, rc[k] || 0); });
      store.counters = mc;

      // Hikayeler: birleşim
      store.storiesCompleted = { ...(remote.storiesCompleted || {}), ...(store.storiesCompleted || {}) };

      // GÜNLÜK GÖREVLER — hesaba özel, kaybolmasın ve karışmasın.
      // Hesap değişiminde local zaten wipeLocalProgress ile null'landı → remote (bu
      // hesabın görevleri) yüklenir. Aynı kullanıcıda iki taraf da bugüne aitse,
      // DAHA FAZLA ilerlemiş olanı al (senkronize olmamış yerel ilerleme kaybolmasın).
      store.quests = _mergeQuests(store.quests, remote.quests, currentUid);

      // Kullanıcı profili: bulut > local (eğer doluysa)
      if (remote.user && remote.user.name) store.user = { ...store.user, ...remote.user };

      // Local store'un sahibini güncelle — bir sonraki kullanıcı değişikliğinde algılayabilelim
      store.ownerUid = currentUid;

      saveStore();
      _refreshAllUI();
      // Birleştirilmiş veriyi tekrar yükle (lokalin daha yenisi varsa)
      await syncNow();
      return true;
    } catch (e) {
      console.warn('[Kelimoli] Cloud pull hatası:', e.code || e.message);
      return false;
    }
  }

  // =====================================================================
  // LEADERBOARD — Haftalık XP yarışı. Lig: bronze/silver/gold/diamond.
  // Doc yolu: leaderboards/{weekId}/entries/{uid}
  // Her hafta sıfırlanan store.weeklyXp toplanır.
  // =====================================================================
  function getWeekId(date = new Date()) {
    // ISO hafta numarası — yıl-W##
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  // Haftalık entry'yi güncelle (debounce'lu — sık çağrılabilir)
  let _lbTimer = null;
  function scheduleLeaderboardUpdate() {
    if (!_ready || !_user || !_db) return;
    clearTimeout(_lbTimer);
    _lbTimer = setTimeout(() => writeLeaderboardEntry().catch(() => {}), 3000);
  }
  async function writeLeaderboardEntry() {
    if (!_ready || !_user || !_db) return false;
    const { doc, setDoc, serverTimestamp } = _fb.firestoreMod;
    const weekId = getWeekId();
    const ref = doc(_db, 'leaderboards', weekId, 'entries', _user.uid);
    try {
      await setDoc(ref, {
        uid: _user.uid,
        name: (store.user && store.user.name) || 'Anonim',
        weeklyXp: store.weeklyXp || 0,
        streak: store.streak || 0,
        level: store.user?.level || 'A1',
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (e) {
      return false;
    }
  }

  // Bu haftaki en yüksek XP'liler (limit=30)
  async function fetchLeaderboard(limitN = 30) {
    if (!_ready || !_db) return null;
    const { collection, query, orderBy, limit, getDocs } = _fb.firestoreMod;
    const weekId = getWeekId();
    try {
      const q = query(
        collection(_db, 'leaderboards', weekId, 'entries'),
        orderBy('weeklyXp', 'desc'),
        limit(limitN)
      );
      // 10sn timeout — Firestore read hang koruması (Apple Review 12 Haz 2026
      // bug pattern: iPadOS 26.5 network call sometimes hangs indefinitely).
      const snap = await Promise.race([
        getDocs(q),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Leaderboard fetch timeout')), 10000))
      ]);
      const entries = [];
      snap.forEach(d => entries.push({ id: d.id, ...d.data() }));
      return entries;
    } catch (e) {
      console.warn('[Kelimoli] Leaderboard fetch hatası:', e.code || e.message);
      return null;
    }
  }

  // ----- Analytics -----
  function logEvent(name, params) {
    if (!_analytics) return;
    const analyticsMod = window.FirebaseBundle && window.FirebaseBundle.analyticsMod;
    if (analyticsMod && analyticsMod.logEvent) {
      try { analyticsMod.logEvent(_analytics, name, params || {}); } catch (e) {}
    }
  }

  return {
    init,
    isReady,
    isAnonymous,
    currentUser,
    onAuthStateChange,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    signOut,
    scheduleSync,
    syncNow,
    flushSync,
    pullAndMerge,
    logEvent,
    getWeekId,
    scheduleLeaderboardUpdate,
    fetchLeaderboard,
  };
})();

window.Cloud = Cloud;
