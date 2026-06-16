/* =====================================================================
   Kelimoli — Oyun Mantığı
   Kelime listesi karma (her alandan).
   Sahne (film/dizi) verisi SCENES dizisine — istediğin YouTube ID'si
   ile genişletebilirsin.
   ===================================================================== */

// =====================================================================
// FEEDBACK — Haptic titreşim + ses efektleri
// Capacitor Haptics plugin'i ile native titreşim; web'de Vibration API.
// Sesler Web Audio API ile sentezleniyor — MP3 dosyası gerekmiyor.
// Ayarlardan kapatılabilir: store.prefs.haptic / store.prefs.sound
// =====================================================================
const Feedback = (() => {
  let audioCtx = null;
  function ctx() {
    if (audioCtx) return audioCtx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
      return audioCtx;
    } catch (e) { return null; }
  }
  function isSoundOn() {
    try { return window.store ? store.prefs?.sound !== false : true; } catch (e) { return true; }
  }
  function isHapticOn() {
    try { return window.store ? store.prefs?.haptic !== false : true; } catch (e) { return true; }
  }
  // İki frekans serisini sırayla çal — "tonlu" his verir.
  function tone(freqs, durMs = 120, type = 'sine', gain = 0.08) {
    if (!isSoundOn()) return;
    const c = ctx();
    if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    const now = c.currentTime;
    const step = durMs / 1000 / freqs.length;
    freqs.forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = f;
      const t0 = now + i * step;
      const t1 = t0 + step;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + step * 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t1);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t1 + 0.02);
    });
  }
  // Capacitor Haptics varsa onu kullan, yoksa Web Vibration API.
  function vibrate(style) {
    if (!isHapticOn()) return;
    try {
      const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (H && typeof H.impact === 'function') {
        // ImpactStyle: Light | Medium | Heavy
        H.impact({ style }).catch(() => {});
        return;
      }
    } catch (e) {}
    if (navigator.vibrate) {
      const ms = style === 'Heavy' ? 30 : style === 'Medium' ? 18 : 10;
      navigator.vibrate(ms);
    }
  }
  return {
    correct() { vibrate('Medium'); tone([660, 880, 1320], 220, 'sine', 0.10); },
    wrong()   { vibrate('Heavy');  tone([220, 165], 260, 'sawtooth', 0.06); },
    tap()     { vibrate('Light');  tone([520], 50, 'sine', 0.04); },
    flip()    { vibrate('Light');  tone([440, 660], 80, 'triangle', 0.05); },
    match()   { vibrate('Medium'); tone([784, 988, 1318], 180, 'triangle', 0.08); },
    mismatch(){ vibrate('Light');  tone([330, 247], 180, 'sawtooth', 0.05); },
    levelUp() { vibrate('Heavy');  tone([523, 659, 784, 1047], 400, 'sine', 0.10); },
  };
})();

// =====================================================================
// İKON SETİ — Tutarlı çizgi-SVG ikonları (Lucide/Feather tarzı).
// currentColor kullanır → bulunduğu kabın rengini ve boyutunu alır.
// HTML'de [data-icon="ad"] olan elemanlara injectIcons() ile basılır.
// =====================================================================
const ICON_PATHS = {
  home:     '<path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9.5 21v-6h5v6"/>',
  grid:     '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  cards:    '<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M8 4h11a1 1 0 0 1 1 1v13"/>',
  user:     '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  close:    '<path d="M6 6l12 12M18 6 6 18"/>',
  speaker:  '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M16 9.5a3.5 3.5 0 0 1 0 5"/><path d="M19 7a7 7 0 0 1 0 10"/>',
  play:     '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  film:     '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 4v16M17 4v16M3 9.3h4M17 9.3h4M3 14.7h4M17 14.7h4"/>',
  quiz:     '<path d="M11 7h9M11 12h9M11 17h6"/><path d="M4 7l1.4 1.4L8 5.6M4 16l1.4 1.4L8 14.6"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  cloud:    '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 18 18z"/>',
  check:    '<path d="M20 6 9 17l-5-5"/>',
  dots:     '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  match:    '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M11 7h2.5A1.5 1.5 0 0 1 15 8.5V13M13 17H8.5A1.5 1.5 0 0 1 7 15.5V11"/>',
  alert:    '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.2"/><circle cx="12" cy="16.4" r="0.7" fill="currentColor" stroke="none"/>',
  alertTri: '<path d="M12 3.5 2.6 20h18.8z"/><path d="M12 9.5v4.3"/><circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none"/>',
  headphones:'<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M6 13H4.5A1.5 1.5 0 0 0 3 14.5v3A1.5 1.5 0 0 0 4.5 19H6zM18 13h1.5A1.5 1.5 0 0 1 21 14.5v3A1.5 1.5 0 0 1 19.5 19H18z"/>',
  book:     '<path d="M11 4.5A2.5 2.5 0 0 0 8.5 3H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4.5a2.5 2.5 0 0 1 2.5 1.5"/><path d="M13 4.5A2.5 2.5 0 0 1 15.5 3H20a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4.5a2.5 2.5 0 0 0-2.5 1.5"/><path d="M12 6.5v13"/>',
  chevron:  '<path d="M9 6l6 6-6 6"/>',
  crown:    '<path d="M4 18.5h16M4.2 8.6l3.6 2.6L12 5.5l4.2 5.7 3.6-2.6-1.5 8.9H5.7z"/>',
  trophy:   '<path d="M7.5 4h9v4.5a4.5 4.5 0 0 1-9 0zM7.5 5.5H5a2 2 0 0 0 2 3.7M16.5 5.5H19a2 2 0 0 1-2 3.7M9.5 18h5M10.2 14.2 9.7 18M13.8 14.2l.5 3.8M8 20.5h8"/>',
  edit:     '<path d="M15.5 4.5l4 4M17 3l4 4L8 20l-4.5 1.2L4.8 16.5z"/>',
  trash:    '<path d="M4 7h16M9.5 7V5.2a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.2 7l.9 12.2a1.6 1.6 0 0 0 1.6 1.5h6.6a1.6 1.6 0 0 0 1.6-1.5L17.8 7M10 11v6M14 11v6"/>',
  shield:   '<path d="M12 3.5l7 2.6v5.1c0 4.3-3 7.4-7 8.8-4-1.4-7-4.5-7-8.8V6.1z"/><path d="M9 12l2 2 4-4.5"/>',
  logout:   '<path d="M15 4h3a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20h-3M10 8 6 12l4 4M6 12h11"/>',
};
function iconSvg(name) {
  const p = ICON_PATHS[name];
  if (!p) return '';
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    const svg = iconSvg(el.getAttribute('data-icon'));
    if (svg) el.innerHTML = svg;
  });
}

// =====================================================================
// XP SİSTEMİ — Zorluğa göre merkezî ödül tablosu.
// Tanıma (kolay) < Bağlam (orta) < Hatırlama/yazma (zor).
// Tüm oyunlar XP'yi buradan okur — tek yerden dengelenebilir.
// =====================================================================
const XP = {
  quizCorrect:   10,   // Çoktan seçmeli (tanıma) — kolay
  matchPair:      8,   // Eşleştirme (tanıma) — kolay
  flashSet:      10,   // Kart seti tamamlama (tekrar/çalışma)
  storyScene:    12,   // Hikaye sahnesi (bağlam) — orta
  falseFriend:   12,   // Yanıltıcı kelime (tuzak öğrenme) — orta
  examCorrect:   10,   // Sınav Modu doğru (akademik tanıma) — orta
  verbCorrect:   10,   // Düzensiz Fiil doğru (hatırlama/yazma) — orta
  orderCorrect:  12,   // Cümle Sıralama doğru (bağlam/dizilim) — orta
  movieCorrect:  20,   // Film sahnesi (dinleme+bağlam+süre) — zor
  listenExact:   18,   // Dinle & Yaz tam isabet (yazma) — zor
  listenClose:   12,   // Dinle & Yaz yakın (1-2 harf hata)
  listenSecond:   6,   // Dinle & Yaz ikinci deneme
  perfectBonus:  15,   // Hatasız tur bonusu (tüm turlar)
};

// =====================================================================
// ACHIEVEMENTS — Rozetler. Her rozet bir ilerleme değeri (value) ve hedefi
// (target) tutar; check = value >= target. Bu yapı kilitli rozetlerde
// "320/500" gibi ilerleme çubuğu göstermeyi sağlar (Duolingo tarzı).
// Yeni rozet: { id, name, desc, icon, target, value: s => number }
// =====================================================================
const ACHIEVEMENTS = [
  { id: 'first_step',     name: 'İlk Adım',         desc: 'İlk sorunu cevapla',              icon: '🌱', target: 1,     value: s => s.totalAnswered || 0 },
  { id: 'quick_learner',  name: 'Hızlı Öğrenen',    desc: '10 doğru cevap ver',              icon: '⚡', target: 10,    value: s => s.totalCorrect || 0 },
  { id: 'scholar',        name: 'Okumuş',           desc: '50 doğru cevap',                  icon: '📚', target: 50,    value: s => s.totalCorrect || 0 },
  { id: 'wordsmith',      name: 'Kelime Ustası',    desc: '200 doğru cevap',                 icon: '🎓', target: 200,   value: s => s.totalCorrect || 0 },
  { id: 'master',         name: 'Akademisyen',      desc: '500 doğru cevap',                 icon: '👑', target: 500,   value: s => s.totalCorrect || 0 },

  { id: 'streak_3',       name: '3 Gün Seri',       desc: 'Üç gün üst üste pratik',          icon: '🔥', target: 3,     value: s => s.streak || 0 },
  { id: 'streak_7',       name: 'Haftalık Seri',    desc: 'Bir hafta üst üste pratik',       icon: '🔥', target: 7,     value: s => s.streak || 0 },
  { id: 'streak_30',      name: 'Aylık Seri',       desc: 'Bir ay üst üste pratik',          icon: '🌟', target: 30,    value: s => s.streak || 0 },
  { id: 'streak_100',     name: 'Yüzyıl',           desc: '100 gün üst üste pratik',         icon: '💎', target: 100,   value: s => s.streak || 0 },

  { id: 'words_50',       name: 'Cüzdan Doldu',     desc: '50 kelime öğren',                 icon: '💼', target: 50,    value: s => countLearnedFor(s) },
  { id: 'words_200',      name: 'Sözlük Cebi',      desc: '200 kelime öğren',                icon: '📖', target: 200,   value: s => countLearnedFor(s) },
  { id: 'words_500',      name: 'Kütüphane',        desc: '500 kelime öğren',                icon: '🏛️', target: 500,   value: s => countLearnedFor(s) },

  { id: 'xp_500',         name: 'Bronz Çırak',      desc: '500 XP topla',                    icon: '🥉', target: 500,   value: s => s.xp || 0 },
  { id: 'xp_2000',        name: 'Gümüş Kalfa',      desc: '2.000 XP topla',                  icon: '🥈', target: 2000,  value: s => s.xp || 0 },
  { id: 'xp_10000',       name: 'Altın Usta',       desc: '10.000 XP topla',                 icon: '🥇', target: 10000, value: s => s.xp || 0 },

  { id: 'cinephile',      name: 'Sinefil',          desc: 'İlk film sahnesini tamamla',      icon: '🎬', target: 1,     value: s => s.counters?.moviesCompleted || 0 },
  { id: 'film_buff',      name: 'Sinema Tutkunu',   desc: '5 film sahnesi tamamla',          icon: '🎥', target: 5,     value: s => s.counters?.moviesCompleted || 0 },
  { id: 'perfectionist',  name: 'Mükemmeliyetçi',   desc: 'Hatasız bir quiz bitir',          icon: '🎯', target: 1,     value: s => s.counters?.perfectQuizzes || 0 },
  { id: 'comeback_kid',   name: 'Geri Dönüş',       desc: 'Hata defterinden 10 kelime kurtar', icon: '💪', target: 10,  value: s => s.counters?.mistakesFixed || 0 },
  { id: 'night_owl',      name: 'Gece Kuşu',        desc: 'Gece 23-04 arası pratik et',      icon: '🦉', target: 1,     value: s => s.counters?.nightSessions || 0 },
  { id: 'early_bird',     name: 'Sabahçı',          desc: 'Sabah 05-08 arası pratik et',     icon: '🌅', target: 1,     value: s => s.counters?.earlySessions || 0 },

  // Öğretici modlar — yeni motivasyon başarımları
  { id: 'exam_starter',   name: 'Sınav Çırağı',     desc: 'İlk sınav modu turunu tamamla',   icon: '📖', target: 1,     value: s => s.counters?.examsCompleted || 0 },
  { id: 'exam_pro',       name: 'Sınav Üstadı',     desc: '5 sınav modu turu tamamla',       icon: '🎓', target: 5,     value: s => s.counters?.examsCompleted || 0 },
  { id: 'exam_legend',    name: 'Sınav Efsanesi',   desc: '15 sınav modu turu tamamla',      icon: '🏆', target: 15,    value: s => s.counters?.examsCompleted || 0 },
  { id: 'verbs_starter',  name: 'Fiil Çırağı',      desc: 'İlk düzensiz fiil turunu tamamla', icon: '🔁', target: 1,    value: s => s.counters?.verbsCompleted || 0 },
  { id: 'verbs_master',   name: 'Fiil Ustası',      desc: '5 düzensiz fiil turu tamamla',    icon: '🛠️', target: 5,     value: s => s.counters?.verbsCompleted || 0 },
  { id: 'order_starter',  name: 'Cümle Çırağı',     desc: 'İlk cümle sıralama turunu tamamla', icon: '🧩', target: 1,   value: s => s.counters?.ordersCompleted || 0 },
  { id: 'order_master',   name: 'Cümle Mimarı',     desc: '5 cümle sıralama turu tamamla',   icon: '📜', target: 5,     value: s => s.counters?.ordersCompleted || 0 },
];

function achValue(a)  { try { return a.value(store) || 0; } catch (e) { return 0; } }
function achDone(a, s = store) { try { return a.value(s) >= a.target; } catch (e) { return false; } }

function countLearnedFor(s) {
  if (!s.wordStats) return 0;
  return Object.values(s.wordStats).filter(w => w.correct >= 2).length;
}

// =====================================================================
// GÜNLÜK GÖREVLER — Her gün rastgele 3 görev, +bonus XP.
// Hepsi tamamlanırsa streak shield (1 günlük seri koruyucu).
// =====================================================================
const QUEST_POOL = [
  { id: 'q_answer_10',  name: '10 soru cevapla',         icon: '📝', xp: 30, target: 10, metric: 'answered',        action: 'quiz' },
  { id: 'q_answer_20',  name: '20 soru cevapla',         icon: '✍️', xp: 50, target: 20, metric: 'answered',        action: 'quiz' },
  { id: 'q_correct_15', name: '15 doğru cevap',          icon: '✅', xp: 40, target: 15, metric: 'correct',         action: 'quiz' },
  { id: 'q_match_1',    name: '1 eşleştirme tamamla',    icon: '🔗', xp: 25, target: 1,  metric: 'matchGames',      action: 'match' },
  { id: 'q_match_2',    name: '2 eşleştirme tamamla',    icon: '🧩', xp: 50, target: 2,  metric: 'matchGames',      action: 'match' },
  { id: 'q_movie',      name: '1 film sahnesi izle',     icon: '🎬', xp: 50, target: 1,  metric: 'movieGames',      action: 'movie',  premiumOnly: true },
  { id: 'q_flash',      name: '1 kart seti bitir',       icon: '🃏', xp: 25, target: 1,  metric: 'flashGames',      action: 'flash' },
  { id: 'q_listen',     name: '1 dinleme oyunu',         icon: '🎧', xp: 30, target: 1,  metric: 'listenGames',     action: 'listen' },
  { id: 'q_perfect',    name: 'Hatasız 1 quiz',          icon: '🎯', xp: 60, target: 1,  metric: 'perfectQuizzes',  action: 'quiz' },
  { id: 'q_xp_100',     name: '100 XP topla',            icon: '⭐', xp: 30, target: 100, metric: 'xpEarned',        action: 'quiz' },
  { id: 'q_exam',       name: '1 sınav modu bitir',      icon: '📖', xp: 35, target: 1,  metric: 'examGames',       action: 'exam' },
  { id: 'q_verbs',      name: '1 fiil turu bitir',       icon: '🔁', xp: 35, target: 1,  metric: 'verbsGames',      action: 'verbs' },
  { id: 'q_order',      name: '1 cümle sıralama bitir',  icon: '🧠', xp: 30, target: 1,  metric: 'orderGames',      action: 'order' },
];

// Belirli güne deterministik 3 görev seç (aynı gün açılırsa görevler değişmesin)
function dailyQuestSeed(dateStr) {
  // Basit string hash
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function shuffleSeed(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Görevlerin sahibi olan kullanıcı (giriş yapılıysa Firebase uid, değilse null)
function questOwnerUid() {
  try {
    if (window.Cloud && Cloud.isReady && Cloud.isReady() && Cloud.currentUser && Cloud.currentUser()) {
      return Cloud.currentUser().uid;
    }
  } catch (e) {}
  return null;
}
function rollDailyQuests() {
  const today = todayStr();
  const uid = questOwnerUid();
  const owner = store.quests && store.quests.owner;
  const dateChanged = !store.quests || store.quests.date !== today;
  const ownerChanged = uid && owner && owner !== uid;   // hesap değişti → görevler de değişsin

  if (dateChanged || ownerChanged) {
    // Tohum tarih + kullanıcıya özel: her hesap farklı görev seti alır,
    // ve hesap değişince görevler + ilerleme sıfırdan başlar.
    const seed = dailyQuestSeed(today + '|' + (uid || 'guest'));
    // Premium-only görevler ücretsiz kullanıcılarda gizli
    const pool = (typeof Premium !== 'undefined' && Premium.isPremium())
      ? QUEST_POOL
      : QUEST_POOL.filter(q => !q.premiumOnly);
    const selected = shuffleSeed(pool, seed).slice(0, 3);
    store.quests = {
      date: today,
      owner: uid || null,
      list: selected.map(q => ({ id: q.id, claimed: false })),
      progress: { answered: 0, correct: 0, matchGames: 0, movieGames: 0, flashGames: 0, listenGames: 0, examGames: 0, verbsGames: 0, orderGames: 0, perfectQuizzes: 0, xpEarned: 0 },
    };
    saveStore();
  } else if (uid && !owner) {
    // İlk kez kullanıcı öğrenildi (misafir→anonim geçişi): görevleri DEĞİŞTİRME,
    // sadece sahibini işaretle ki ilerleme sıfırlanmasın.
    store.quests.owner = uid;
    saveStore();
  }
}

function getQuestDef(id) { return QUEST_POOL.find(q => q.id === id); }

function questProgressValue(q) {
  return (store.quests?.progress?.[q.metric]) || 0;
}

// Hedefine ulaşmış görevleri ödüllendirir. Bonus XP, başka bir 'xpEarned'
// görevini de tetikleyebileceğinden sınırlı bir döngüyle tekrar tarar — eski
// addXP ↔ bumpQuestMetric özyinelemesinin yerine düz ve sınırı belli bir geçiş.
// claimed bayrağı çift ödülü, guard sayacı sonsuz döngüyü engeller.
function awardCompletedQuests() {
  if (!store.quests || !Array.isArray(store.quests.list)) return;
  rollWeeklyCounter();
  let changed = true, guard = 0;
  while (changed && guard++ < 10) {
    changed = false;
    for (const item of store.quests.list) {
      if (item.claimed) continue;
      const def = getQuestDef(item.id);
      if (!def) continue;
      if (questProgressValue(def) >= def.target) {
        item.claimed = true;
        store.xp += def.xp;
        store.weeklyXp = (store.weeklyXp || 0) + def.xp;
        // Bonus XP de 'xpEarned' görevine sayılsın
        store.quests.progress.xpEarned = (store.quests.progress.xpEarned || 0) + def.xp;
        Feedback.levelUp();
        showAchievementPopup({ icon: def.icon, name: 'Görev tamamlandı!', desc: `${def.name} · +${def.xp} XP` });
        changed = true;
      }
    }
  }
}

function bumpQuestMetric(metric, by = 1) {
  rollDailyQuests();
  store.quests.progress[metric] = (store.quests.progress[metric] || 0) + by;
  awardCompletedQuests();
  saveStore();
  renderQuests();
}

function renderQuests() {
  rollDailyQuests();
  const wrap = $('#questsList');
  if (!wrap) return;
  wrap.innerHTML = store.quests.list.map(item => {
    const def = getQuestDef(item.id);
    if (!def) return '';
    const val = Math.min(questProgressValue(def), def.target);
    const pct = Math.round((val / def.target) * 100);
    const done = item.claimed;
    return `
      <div class="quest-item ${done ? 'done' : ''}" data-action="${def.action || ''}" role="button" tabindex="0">
        <div class="quest-icon">${def.icon}</div>
        <div class="quest-body">
          <div class="quest-row">
            <div class="quest-name">${def.name}</div>
            <div class="quest-xp">+${def.xp} XP</div>
          </div>
          <div class="quest-progress">
            <div class="quest-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="quest-meta">${val} / ${def.target}${done ? ' · Tamamlandı ✓' : (def.action ? ' · Başlamak için dokun' : '')}</div>
        </div>
      </div>
    `;
  }).join('');

  // Tamamlanmamış görev kartına dokununca ilgili oyunu başlat
  wrap.querySelectorAll('.quest-item').forEach(el => {
    const action = el.dataset.action;
    if (!action || el.classList.contains('done')) return;
    el.onclick = () => triggerGame(action);
    el.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerGame(action); }
    };
  });
}

// Bir rozet açıldığında: kayda al, popup kuyruğuna ekle
function unlockAchievement(ach) {
  if (!store.achievements) store.achievements = { unlocked: [], seen: [] };
  if (store.achievements.unlocked.includes(ach.id)) return;
  store.achievements.unlocked.push(ach.id);
  store.achievements.lastUnlockedAt = Date.now();
  saveStore();
  showAchievementPopup(ach);
}

// Tüm rozetleri kontrol et, açılması gerekenleri aç. Her etkinlikten sonra çağrılır.
function checkAchievements() {
  if (!store.achievements) store.achievements = { unlocked: [], seen: [] };
  for (const a of ACHIEVEMENTS) {
    if (!store.achievements.unlocked.includes(a.id) && achDone(a)) {
      unlockAchievement(a);
    }
  }
}

// "Hata defterinden kelime kurtar" gibi özel sayaçlar
function bumpCounter(name, by = 1) {
  if (!store.counters) store.counters = {};
  store.counters[name] = (store.counters[name] || 0) + by;
  saveStore();
}

// Gece/sabah pratiği — zaman bazlı sayaç
function trackTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 23 || h < 4) bumpCounter('nightSessions');
  else if (h >= 5 && h < 8) bumpCounter('earlySessions');
}

// Popup KUYRUĞU — aynı anda birden çok rozet açılırsa sırayla göster (üst üste binmez)
let _achQueue = [];
let _achBusy = false;
function showAchievementPopup(ach) {
  _achQueue.push(ach);
  if (!_achBusy) _drainAchPopups();
}
function _drainAchPopups() {
  if (!_achQueue.length) { _achBusy = false; return; }
  _achBusy = true;
  const ach = _achQueue.shift();
  let pop = document.getElementById('achPopup');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'achPopup';
    pop.className = 'ach-popup';
    pop.innerHTML = `
      <div class="ach-popup-icon"></div>
      <div class="ach-popup-body">
        <div class="ach-popup-kicker">Yeni Rozet</div>
        <div class="ach-popup-name"></div>
        <div class="ach-popup-desc"></div>
      </div>`;
    document.body.appendChild(pop);
  }
  pop.querySelector('.ach-popup-kicker').textContent = ach.kicker || 'Yeni Rozet';
  pop.querySelector('.ach-popup-icon').textContent = ach.icon;
  pop.querySelector('.ach-popup-name').textContent = ach.name;
  pop.querySelector('.ach-popup-desc').textContent = ach.desc;
  pop.classList.remove('show');
  void pop.offsetWidth; // reflow → animasyon yeniden çalışsın
  pop.classList.add('show');
  Feedback.levelUp();   // ses + titreşim (her popup için)
  clearTimeout(pop._hideTimer);
  pop._hideTimer = setTimeout(() => {
    pop.classList.remove('show');
    setTimeout(_drainAchPopups, 400); // kuyruktaki bir sonrakini göster
  }, 2600);
}

// Profil ekranındaki rozet listesini render et — kilitlilerde ilerleme çubuğu.
// Varsayılan: ilk birkaçını göster + "Devamını gör" ile geri kalanı aç.
let _achExpanded = false;
const ACH_PREVIEW_COUNT = 4;
function renderAchievementsList() {
  const wrap = document.querySelector('.achievement-list');
  if (!wrap) return;
  const unlocked = new Set(store.achievements?.unlocked || []);
  const total = ACHIEVEMENTS.length;
  const got = unlocked.size;
  // Açılanlar üstte; kilitliler en yakın olandan uzağa sıralanır
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const ua = unlocked.has(a.id), ub = unlocked.has(b.id);
    if (ua !== ub) return ua ? -1 : 1;
    if (ua) return 0;
    return (achValue(b) / b.target) - (achValue(a) / a.target);
  });
  const shown = _achExpanded ? sorted : sorted.slice(0, ACH_PREVIEW_COUNT);
  const hiddenCount = total - shown.length;

  wrap.innerHTML = `
    <div class="ach-summary">
      <span class="ach-count">${got} / ${total}</span>
      <span class="ach-count-lbl">rozet kazanıldı</span>
    </div>
    ${shown.map(a => {
      const on = unlocked.has(a.id);
      const cur = Math.min(achValue(a), a.target);
      const pct = Math.round((cur / a.target) * 100);
      const showBar = !on && a.target > 1; // 1 hedefli rozetlerde çubuk gösterme
      return `<div class="ach-item ${on ? 'unlocked' : ''}">
        <div class="ach-icon ${on ? 'on' : ''}">${a.icon}</div>
        <div class="ach-text">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
          ${showBar ? `<div class="ach-progress"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
          <div class="ach-progress-num">${cur} / ${a.target}</div>` : ''}
        </div>
        ${on ? '<div class="ach-check">✓</div>' : ''}
      </div>`;
    }).join('')}
    ${(hiddenCount > 0 || _achExpanded)
      ? `<button class="ach-more-btn" id="achMoreBtn">
           ${_achExpanded ? 'Daha az göster' : `Devamını gör (${hiddenCount})`}
           <span class="ach-more-chev ${_achExpanded ? 'up' : ''}"></span>
         </button>`
      : ''}
  `;
  const moreBtn = wrap.querySelector('#achMoreBtn');
  if (moreBtn) {
    moreBtn.querySelector('.ach-more-chev').innerHTML = iconSvg('chevron');
    moreBtn.onclick = () => { _achExpanded = !_achExpanded; renderAchievementsList(); Feedback.tap(); };
  }
}

// =====================================================================
// STORIES — Mini interaktif hikayeler. Her sahnede ya boşluk doldur,
// ya da seçim yap. Hikayeler kısa (5-8 sahne), gündelik İngilizce.
// scene tipleri:
//   - 'narration' : sadece okuma (devam et)
//   - 'choice'    : doğru seçimi yap (text-based mc)
//   - 'fill'      : verilen kelimelerden doğru olanı boşluğa koy
// =====================================================================
// STORIES dizisi -> kelimoli-data.js (refactor: veri/mantik ayrimi)

// =====================================================================
// FALSE FRIENDS — Türkçeye benzer gözüküp farklı anlam taşıyan kelimeler.
// Türk öğrencilerin en sık yaptığı hatalar.
// Format: { en, ph, tr_yanlis (sandığın), tr_dogru (asıl anlamı), example_en, example_tr }
// =====================================================================
// FALSE_FRIENDS dizisi -> kelimoli-data.js (refactor: veri/mantik ayrimi)

// ---------- KELIME VERITABANI (Mücahit'in A2 defteri — tüm konular) ----------
// WORDS dizisi -> kelimoli-data.js (refactor: veri/mantik ayrimi)

// =====================================================================
// SEVİYE HAVUZLARI (CEFR) — A1 ⊂ A2 ⊂ B1 ⊂ B2 (kümülatif)
// Her kelimeye `level` etiketi konur (yoksa A1 sayılır — mevcut 233 kelime A1).
// İsteğe bağlı `exam` etiketi: "YDS · akademik", "IELTS academic" vb.
// Kullanıcının seçtiği seviyeye göre oyunlar O HAVUZdan kelime çeker:
//   A1 → A1 | A2 → A1+A2 | B1 → A1+A2+B1 | B2 → hepsi
// =====================================================================
// Başlangıç = ilk 233 temel kelime (etiketsiz). Üstü CEFR: A1 < A2 < B1 < B2.
const LEVEL_ORDER = { 'Başlangıç': 1, A1: 2, A2: 3, B1: 4, B2: 5 };
const LEVEL_LABELS = ['Başlangıç', 'A1', 'A2', 'B1', 'B2'];
function wordLevel(w) { return (w && w.level) || 'Başlangıç'; }
// Kelime rozeti metni: "A1 · Temel" / "B1 · YDS akademik" / "A2"
function wordTag(w) {
  const lv = wordLevel(w);
  const ex = w && w.exam;
  return ex ? `${lv} · ${ex}` : lv;
}
function userLevel() {
  const lv = (store.user && store.user.level) || 'A1';
  return LEVEL_ORDER[lv] ? lv : 'A1';
}
// Kullanıcının seçtiği seviyenin İZOLE kelime havuzu (kümülatif DEĞİL).
// Örn. B1 seçince yalnızca level==="B1" olan kelimeler; A1 etiketsiz başlangıç
// kelimeleri "Başlangıç" sayılır ve sadece o seviye seçilince çıkar.
// Güvenlik fallback'i: havuz beklenmedik şekilde boş kalırsa tümüne düş.
function getActivePool() {
  const lv = userLevel();
  const pool = WORDS.filter(w => wordLevel(w) === lv);
  return pool.length ? pool : WORDS;
}

// =====================================================================
// KALICI VERİ KATMANI (LocalStorage)
// XP, seri, kelime istatistikleri sayfa kapansa da kalır.
// Burası hata defteri ve spaced repetition için de zemindir.
// =====================================================================
const STORAGE_KEY = 'kelimoli-v1';

const defaultStore = {
  xp: 0,
  streak: 0,
  hearts: 5,
  heartsUpdatedAt: null,  // son kalp kaybı zamanı (zamanla yenilenme için)
  lastActiveDate: null,   // YYYY-MM-DD (seri için)
  todayDate: null,        // günlük sayaçların sıfırlandığı tarih
  todayAnswered: 0,       // bugün cevaplanan soru
  dailyGoal: 10,
  wordStats: {},          // { "en_lowercase": { correct, wrong, lastSeen } }
  totalCorrect: 0,
  totalAnswered: 0,
  // Onboarding ile gelen profil
  onboarded: false,
  user: {
    name: '',
    reason: '',           // work | travel | exam | culture | hobby
    level: 'A1',          // A1 | A2 | B1
  },
  // Geri bildirim tercihleri (haptic titreşim + ses efektleri + tema + bildirim)
  prefs: {
    haptic: true,
    sound: true,
    theme: 'auto',           // 'auto' (sistem) | 'light' | 'dark'
    notif: false,            // günlük hatırlatma aktif mi
    notifHour: 19,           // saat (24h)
    notifMinute: 0,
  },
};

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultStore };
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch (e) {
    return { ...defaultStore };
  }
}
function saveStore() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (e) {}
  // Bulut sync (debounce'lu, Cloud hazırsa)
  try { if (window.Cloud && Cloud.isReady()) Cloud.scheduleSync(); } catch (e) {}
}
const store = loadStore();
// prefs eski kayıtta yoksa yedek olarak default'tan al
if (!store.prefs) store.prefs = { ...defaultStore.prefs };
window.store = store; // Feedback modülü tercihleri okuyabilsin

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function rollDailyCounters() {
  const today = todayStr();
  if (store.todayDate !== today) {
    store.todayDate = today;
    store.todayAnswered = 0;
    saveStore();
  }
  // Seri kırıldı mı? (en son aktivite 2+ gün önceyse)
  if (store.lastActiveDate && store.lastActiveDate !== today && store.lastActiveDate !== yesterdayStr() && store.streak > 0) {
    store.streak = 0;
    saveStore();
  }
}
function tickStreakOnActivity() {
  const today = todayStr();
  if (store.lastActiveDate === today) return;
  if (store.lastActiveDate === yesterdayStr()) store.streak += 1;
  else                                          store.streak = 1;
  store.lastActiveDate = today;
  saveStore();
}
// Oturum/genel istatistik kaydı — KELİME-BAĞIMSIZ.
// Tek kelimeye bağlanmayan modlar da (Cümle Sıralama, Düzensiz Fiiller)
// doğruluk %, seri, günlük görev ve başarımlara katkı versin diye buradan geçer.
// Kelime-bazlı modlar recordAnswer() üzerinden buraya delege eder.
function recordActivity(isCorrect) {
  rollDailyCounters();
  rollDailyQuests();
  if (isCorrect) {
    store.totalCorrect++;
    bumpQuestMetric('correct');
  }
  store.totalAnswered++;
  store.todayAnswered++;
  bumpQuestMetric('answered');
  tickStreakOnActivity();
  trackTimeOfDay();
  saveStore();
  refreshStats();
  checkAchievements();
}

function recordAnswer(wordEn, isCorrect, opts = {}) {
  if (!wordEn) return;
  const key = String(wordEn).toLowerCase();
  const prev = store.wordStats[key];
  const wasMistake = prev && prev.wrong > 0 && prev.correct === 0;
  if (!store.wordStats[key]) store.wordStats[key] = { correct: 0, wrong: 0, lastSeen: 0 };
  const stat = store.wordStats[key];
  stat.lastSeen = Date.now();

  if (isCorrect) {
    stat.correct++;
    if (wasMistake) bumpCounter('mistakesFixed');
  } else { stat.wrong++; }

  // SM-2 quality: 0-5. Bağlam (oyun türü) opts.quality ile gelir; yoksa
  // doğru=5, yanlış=2 olarak varsay.
  const quality = opts.quality !== undefined
    ? opts.quality
    : (isCorrect ? 5 : 2);
  sm2Update(stat, quality);

  // Genel istatistikler (totalCorrect/Answered, seri, görev, başarım)
  recordActivity(isCorrect);
}
// =====================================================================
// SEVİYE SİSTEMİ — XP'den seviye hesabı
// Formül: xpForLevel(n) = (n-1) * n * 50
//   Level 1: 0, Level 2: 100, Level 3: 300, Level 4: 600, Level 5: 1000,
//   Level 6: 1500, Level 7: 2100, Level 10: 4500, Level 20: 19000
// =====================================================================
function xpForLevel(n) {
  return (n - 1) * n * 50;
}
function getLevelFromXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const xpForThis = xpForLevel(level);
  const xpForNext = xpForLevel(level + 1);
  const span = xpForNext - xpForThis;
  const into = xp - xpForThis;
  const progress = span > 0 ? Math.round((into / span) * 100) : 0;
  const remaining = Math.max(0, xpForNext - xp);
  return { level, xpForThis, xpForNext, progress, remaining };
}

function addXP(amount) {
  store.xp += amount;
  // Haftalık leaderboard sayacı (her pazartesi sıfırlanır)
  rollWeeklyCounter();
  store.weeklyXp = (store.weeklyXp || 0) + amount;
  // XP kazanımı 'xpEarned' görevine sayılır; tamamlanan görevlerin bonusu da
  // awardCompletedQuests içinde verilir (özyineleme yok). Quest yoksa atla.
  if (store.quests) {
    store.quests.progress.xpEarned = (store.quests.progress.xpEarned || 0) + amount;
    awardCompletedQuests();
    renderQuests();
  }
  saveStore();
  refreshStats();
  checkAchievements();
  if (window.Cloud && Cloud.isReady()) Cloud.scheduleLeaderboardUpdate();
}

// =====================================================================
// HEARTS (CAN) SİSTEMİ — Duolingo tarzı.
// 5 kalp. Quiz / Listen / Movie'de yanlış cevap 1 kalp götürür.
// Kalp biterse bu modlar kilitlenir; her 30 dakikada 1 kalp dolar,
// reklam izleyerek tümü dolar veya Premium ile sınırsız olur.
// =====================================================================
const HEARTS_MAX = 5;
const HEART_REGEN_MS = 30 * 60 * 1000; // 30 dk / kalp

function isUnlimitedHearts() {
  try { return typeof Premium !== 'undefined' && Premium.isPremium(); }
  catch (e) { return false; }
}

// Geçen süreye göre kalpleri yenile (her okumadan önce çağrılır)
function regenHearts() {
  if (store.hearts == null) store.hearts = HEARTS_MAX;
  if (store.hearts >= HEARTS_MAX) { store.heartsUpdatedAt = null; return; }
  if (!store.heartsUpdatedAt) { store.heartsUpdatedAt = Date.now(); return; }
  const elapsed = Date.now() - store.heartsUpdatedAt;
  if (elapsed <= 0) return;
  const gained = Math.floor(elapsed / HEART_REGEN_MS);
  if (gained > 0) {
    store.hearts = Math.min(HEARTS_MAX, store.hearts + gained);
    if (store.hearts >= HEARTS_MAX) store.heartsUpdatedAt = null;
    else store.heartsUpdatedAt += gained * HEART_REGEN_MS;
    saveStore();
  }
}

function loseHeart() {
  if (isUnlimitedHearts()) return;
  regenHearts();
  if ((store.hearts ?? HEARTS_MAX) >= HEARTS_MAX) store.heartsUpdatedAt = Date.now();
  store.hearts = Math.max(0, (store.hearts ?? HEARTS_MAX) - 1);
  saveStore();
  renderHearts();
}

function refillHearts(n) {
  store.hearts = Math.min(HEARTS_MAX, (store.hearts ?? 0) + (n || HEARTS_MAX));
  if (store.hearts >= HEARTS_MAX) store.heartsUpdatedAt = null;
  saveStore();
  renderHearts();
}

function msUntilNextHeart() {
  regenHearts();
  if ((store.hearts ?? HEARTS_MAX) >= HEARTS_MAX || !store.heartsUpdatedAt) return 0;
  return Math.max(0, HEART_REGEN_MS - (Date.now() - store.heartsUpdatedAt));
}

function fmtCountdown(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Tüm kalp göstergelerini güncelle (üst bar + oyun başlıkları)
function renderHearts() {
  regenHearts();
  const unlimited = isUnlimitedHearts();
  const depleted = !unlimited && (store.hearts ?? 0) <= 0;
  const val = unlimited ? '∞' : String(store.hearts ?? HEARTS_MAX);
  document.querySelectorAll('[data-hearts-value]').forEach(el => { el.textContent = val; });
  document.querySelectorAll('[data-hearts-chip]').forEach(el => {
    el.classList.toggle('depleted', depleted);
    el.classList.toggle('unlimited', unlimited);
  });
}

// Bir modu oynamak için kalp var mı? Yoksa modal açar, false döner.
function ensureHearts() {
  if (isUnlimitedHearts()) return true;
  regenHearts();
  if ((store.hearts ?? 0) > 0) return true;
  showHeartsModal();
  return false;
}

// 0 kalp modalı: bekleme sayacı + reklam izle + premium
let _heartsModalTimer = null;
function showHeartsModal() {
  let modal = document.getElementById('heartsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'heartsModal';
    modal.className = 'hearts-modal-overlay';
    modal.innerHTML = `
      <div class="hearts-modal">
        <div class="hearts-modal-icon">💔</div>
        <h3 class="hearts-modal-title">Kalbin kalmadı!</h3>
        <p class="hearts-modal-sub" id="heartsModalSub">Yeni kalp için bekle ya da hemen doldur.</p>
        <div class="hearts-modal-timer" id="heartsModalTimer">—</div>
        <button class="btn btn-primary btn-full" id="heartsWatchAd">🎬 Reklam izle · Kalpleri doldur</button>
        <button class="btn btn-ghost btn-full" id="heartsGoPremium" style="margin-top:8px">👑 Premium al · Sınırsız kalp</button>
        <button class="hearts-modal-close" id="heartsModalClose">Kapat</button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.classList.add('show');

  const timerEl = modal.querySelector('#heartsModalTimer');
  const sub = modal.querySelector('#heartsModalSub');
  const tick = () => {
    if (isUnlimitedHearts() || (store.hearts ?? 0) > 0) {
      closeHeartsModal();
      renderHearts();
      return;
    }
    timerEl.textContent = `Sonraki kalp: ${fmtCountdown(msUntilNextHeart())}`;
  };
  clearInterval(_heartsModalTimer);
  tick();
  _heartsModalTimer = setInterval(tick, 1000);

  modal.querySelector('#heartsModalClose').onclick = closeHeartsModal;
  // Kalp modalındaki "Premium al" butonu — premium feature kapalıyken gizle.
  const goPremiumBtn = modal.querySelector('#heartsGoPremium');
  if (goPremiumBtn) {
    if (!PREMIUM_FEATURE_AVAILABLE) {
      goPremiumBtn.style.display = 'none';
    } else {
      goPremiumBtn.onclick = () => { closeHeartsModal(); showScreen('paywall'); };
    }
  }
  modal.querySelector('#heartsWatchAd').onclick = async () => {
    const btn = modal.querySelector('#heartsWatchAd');
    btn.disabled = true; btn.textContent = 'Reklam yükleniyor…';
    let res = { rewarded: false };
    try { res = await Ads.showRewarded(); } catch (e) {}
    btn.disabled = false; btn.textContent = '🎬 Reklam izle · Kalpleri doldur';
    if (res && res.rewarded) {
      refillHearts(HEARTS_MAX);
      closeHeartsModal();
    } else {
      sub.textContent = 'Reklam şu an gösterilemedi. İnternetini kontrol et veya biraz sonra dene.';
    }
  };
}
function closeHeartsModal() {
  clearInterval(_heartsModalTimer);
  _heartsModalTimer = null;
  const modal = document.getElementById('heartsModal');
  if (modal) modal.classList.remove('show');
}

// =====================================================================
// GENEL ONAY PENCERESI — oyundan çıkış vb. için
// =====================================================================
function showConfirm({ title, message, confirmText = 'Evet', cancelText = 'Vazgeç', danger = false, onConfirm, onCancel }) {
  let modal = document.getElementById('confirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'confirm-overlay';
    modal.innerHTML = `
      <div class="confirm-box">
        <h3 class="confirm-title"></h3>
        <p class="confirm-msg"></p>
        <button class="confirm-yes"></button>
        <button class="confirm-no"></button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.querySelector('.confirm-title').textContent = title || '';
  modal.querySelector('.confirm-msg').textContent = message || '';
  const yes = modal.querySelector('.confirm-yes');
  const no = modal.querySelector('.confirm-no');
  yes.textContent = confirmText;
  no.textContent = cancelText;
  yes.classList.toggle('danger', !!danger);
  modal.classList.add('show');
  const close = () => modal.classList.remove('show');
  yes.onclick = () => { close(); if (onConfirm) onConfirm(); };
  no.onclick = () => { close(); if (onCancel) onCancel(); };
  modal.onclick = (e) => { if (e.target === modal) { close(); if (onCancel) onCancel(); } };
}

// Yarıda kalan bir oyundan çıkışı onaylat (Duolingo tarzı — ilerleme silinir)
function confirmExitGame(targetScreen, beforeExit, onCancel) {
  showConfirm({
    title: 'Oyundan çık?',
    message: 'Çıkarsan bu turdaki ilerlemen kaybolacak.',
    confirmText: 'Çık',
    cancelText: 'Devam et',
    danger: true,
    onConfirm: () => { if (beforeExit) beforeExit(); showScreen(targetScreen); },
    onCancel: () => { if (onCancel) onCancel(); },
  });
}

// Profilden seviye değiştirmeye özel geçiş ekranı — kullanıcı değişimin farkında olsun
function confirmLevelChange(newLevel) {
  const cur = userLevel();
  if (!LEVEL_ORDER[newLevel] || newLevel === cur) return;
  const goingUp = (LEVEL_ORDER[newLevel] || 0) > (LEVEL_ORDER[cur] || 0);
  let modal = document.getElementById('levelSwitchModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'levelSwitchModal';
    modal.className = 'confirm-overlay';
    modal.innerHTML = `
      <div class="confirm-box lvlswitch-box">
        <div class="lvlswitch-flow">
          <span class="lvlswitch-chip lvlswitch-from"></span>
          <span class="lvlswitch-arrow">→</span>
          <span class="lvlswitch-chip lvlswitch-to"></span>
        </div>
        <h3 class="confirm-title">Seviyeni değiştir</h3>
        <p class="confirm-msg"></p>
        <button class="confirm-yes"></button>
        <button class="confirm-no"></button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.querySelector('.lvlswitch-from').textContent = cur;
  modal.querySelector('.lvlswitch-to').textContent = newLevel;
  modal.querySelector('.confirm-msg').textContent =
    `Bundan sonra SADECE ${newLevel} seviyesindeki kelimelerle çalışacaksın. ` +
    (goingUp ? 'Daha üst seviye kelimelere geçiyorsun.'
             : 'Önceki seviye kelimelerine geri dönüyorsun.');
  const yes = modal.querySelector('.confirm-yes');
  const no = modal.querySelector('.confirm-no');
  yes.textContent = `Evet, ${newLevel} seviyesine geç`;
  no.textContent = 'Vazgeç';
  modal.classList.add('show');
  const close = () => modal.classList.remove('show');
  yes.onclick = () => {
    close();
    if (!store.user) store.user = {};
    store.user.level = newLevel;
    saveStore();
    renderProfileLevel();
    refreshStats();        // havuz değişti → due sayısı/home güncellensin
    Feedback.tap();
    try { if (window.Cloud && Cloud.isReady()) Cloud.scheduleLeaderboardUpdate(); } catch (e) {}
  };
  no.onclick = () => { close(); renderProfileLevel(); };
  modal.onclick = (e) => { if (e.target === modal) { close(); renderProfileLevel(); } };
}

// Metin girişli pencere (isim düzenleme vb.)
function showPrompt({ title, message, value = '', placeholder = '', confirmText = 'Kaydet', cancelText = 'Vazgeç', maxLength = 24, onSave, validate }) {
  let modal = document.getElementById('promptModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'promptModal';
    modal.className = 'confirm-overlay';
    modal.innerHTML = `
      <div class="confirm-box">
        <h3 class="confirm-title"></h3>
        <p class="confirm-msg"></p>
        <input type="text" class="prompt-input" id="promptInput" autocomplete="off" />
        <button class="confirm-yes" id="promptSave"></button>
        <button class="confirm-no" id="promptCancel"></button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.querySelector('.confirm-title').textContent = title || '';
  const msgEl = modal.querySelector('.confirm-msg');
  msgEl.textContent = message || '';
  msgEl.style.display = message ? '' : 'none';
  const input = modal.querySelector('#promptInput');
  input.value = value || '';
  input.placeholder = placeholder || '';
  input.maxLength = maxLength;
  const saveBtn = modal.querySelector('#promptSave');
  const cancelBtn = modal.querySelector('#promptCancel');
  saveBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;
  modal.classList.add('show');
  setTimeout(() => { try { input.focus(); input.select(); } catch (e) {} }, 60);
  const close = () => modal.classList.remove('show');
  // Hata satırı (validate başarısızsa msgEl'i kırmızı kullan)
  input.oninput = () => { input.classList.remove('input-error'); if (!message) { msgEl.style.display = 'none'; msgEl.classList.remove('prompt-err'); } };
  saveBtn.onclick = () => {
    const v = input.value.trim();
    if (validate) {
      const res = validate(v);
      if (res && !res.ok) {
        msgEl.textContent = res.reason || 'Geçersiz giriş.';
        msgEl.style.display = '';
        msgEl.classList.add('prompt-err');
        input.classList.add('input-error');
        Feedback.wrong();
        return; // modal açık kalsın
      }
    }
    msgEl.classList.remove('prompt-err');
    close();
    if (onSave) onSave(v);
  };
  cancelBtn.onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); } };
}

// Profil — seviye butonlarının aktifini + havuz bilgisini güncelle
function renderProfileLevel() {
  const cur = userLevel();
  document.querySelectorAll('#levelSelect .lvl-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.level === cur);
  });
  const hint = document.getElementById('levelPoolHint');
  if (hint) {
    const count = WORDS.filter(w => wordLevel(w) === cur).length;
    hint.textContent = `${cur} seviyesinde çalışıyorsun`;
  }
}

// Her ISO haftada bir weeklyXp sıfırla
function rollWeeklyCounter() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  const weekId = `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  if (store.weekId !== weekId) {
    store.weekId = weekId;
    store.weeklyXp = 0;
  }
}
function countLearnedWords() {
  return Object.values(store.wordStats).filter(s => s.correct >= 2).length;
}
function accuracy() {
  if (store.totalAnswered === 0) return 0;
  return Math.round((store.totalCorrect / store.totalAnswered) * 100);
}

// =====================================================================
// SM-2 SPACED REPETITION — Anki'nin temel aldığı bilimsel algoritma.
// Her kelime için: easeFactor (kolaylık), interval (gün), repetition,
// nextReview (ne zaman tekrar gösterilmeli — timestamp).
// Kullanıcı 0-5 arası "kalite" verir; biz quiz doğru/yanlış'ı buna mapliyoruz:
//   - Doğru (ilk denemede)        → 5
//   - Doğru (zorlandı, çok bekledi) → 4
//   - Doğru (iki deneme listen)   → 3
//   - Yanlış (yakındı)            → 2
//   - Yanlış                       → 1
//   - Hiçbir fikir / atlandı       → 0
// quality < 3 ise tekrar başa al (interval=1, repetition=0).
// =====================================================================
const SM2_DEFAULT_EASE = 2.5;
const SM2_MIN_EASE = 1.3;

function ensureSRS(stat) {
  if (stat.ef === undefined)     stat.ef = SM2_DEFAULT_EASE;
  if (stat.interval === undefined) stat.interval = 0;
  if (stat.rep === undefined)    stat.rep = 0;
  if (stat.due === undefined)    stat.due = Date.now(); // hemen "vade"de
  return stat;
}

// SM-2 ana formülü
function sm2Update(stat, quality) {
  ensureSRS(stat);
  const q = Math.max(0, Math.min(5, quality));
  if (q < 3) {
    stat.rep = 0;
    stat.interval = 1; // bir gün sonra tekrar
  } else {
    stat.rep += 1;
    if (stat.rep === 1)      stat.interval = 1;
    else if (stat.rep === 2) stat.interval = 6;
    else                     stat.interval = Math.round(stat.interval * stat.ef);
  }
  // Ease faktörü güncelle
  stat.ef = stat.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (stat.ef < SM2_MIN_EASE) stat.ef = SM2_MIN_EASE;
  stat.due = Date.now() + stat.interval * 86400000;
  return stat;
}

// recordAnswer'ı doğrudan değil, oyun bağlamlı kalite ile sm2 güncellesi
function gradeWord(wordEn, quality) {
  const key = String(wordEn).toLowerCase();
  if (!store.wordStats[key]) store.wordStats[key] = { correct: 0, wrong: 0, lastSeen: 0 };
  ensureSRS(store.wordStats[key]);
  sm2Update(store.wordStats[key], quality);
  saveStore();
}

// Bugün vadesi gelmiş kelimeleri döndür — yalnız GERÇEK TEKRAR.
// "Hiç görülmemiş" kelimeler artık burada sayılmaz; pickStudyWords onları
// fallback olarak active pool'dan zayıflık skoruyla getirir.
function getDueWords(limit = 50) {
  const now = Date.now();
  const due = [];
  for (const w of getActivePool()) {
    const key = String(w.en).toLowerCase();
    const s = store.wordStats[key];
    if (s && s.due !== undefined && s.due <= now) {
      due.push({ word: w, score: now - s.due }); // ne kadar geride kaldıysa o kadar acil
    }
  }
  due.sort((a, b) => b.score - a.score);
  return due.slice(0, limit).map(x => x.word);
}

// Banner sayımı — yalnız görülmüş + vadesi gelmiş kelimeler (SRS standardı).
// Yeni kullanıcı / hiç çalışmamış seviyede 0 döner → banner gizli kalır.
function countDueToday() {
  const now = Date.now();
  let n = 0;
  for (const w of getActivePool()) {
    const s = store.wordStats[String(w.en).toLowerCase()];
    if (s && s.due !== undefined && s.due <= now) n++;
  }
  return n;
}

// Eski "zayıflık skoru" — SM-2 olmayan modlar için yedek
function weaknessScore(wordEn) {
  const key = String(wordEn).toLowerCase();
  const s = store.wordStats[key];
  if (!s) return 1.0;
  // SM-2 verisi varsa kullan: vadesi geçenler daha ağır
  if (s.due !== undefined) {
    const overdue = (Date.now() - s.due) / 86400000;
    return Math.max(0.2, Math.min(3, 1 + overdue * 0.3));
  }
  const total = s.correct + s.wrong;
  if (total === 0) return 1.0;
  const wrongRatio = s.wrong / total;
  const daysSince = (Date.now() - s.lastSeen) / 86400000;
  return wrongRatio * 2 + Math.min(daysSince / 7, 1);
}

// Spaced repetition: önce vadesi gelmiş kelimeleri al, sonra zayıflık skoruna göre tamamla
function pickStudyWords(n) {
  // Önce vadesi gelmiş kelimeleri al (SM-2'ye göre tekrar zamanı)
  const due = getDueWords(n);
  if (due.length >= n) return shuffle(due).slice(0, n);

  // Vade yetmedi — kalan kotayı zayıflık skoruna göre doldur
  const dueSet = new Set(due.map(w => w.en.toLowerCase()));
  const activePool = getActivePool();
  const pool = activePool
    .filter(w => !dueSet.has(w.en.toLowerCase()))
    .map(w => ({ word: w, weight: weaknessScore(w.en) + 0.3 }));
  const picked = [...due];
  const used = new Set(dueSet);
  while (picked.length < n && used.size < activePool.length) {
    const avail = pool.filter(p => !used.has(p.word.en.toLowerCase()));
    if (!avail.length) break;
    const total = avail.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of avail) {
      r -= p.weight;
      if (r <= 0) {
        picked.push(p.word);
        used.add(p.word.en.toLowerCase());
        break;
      }
    }
  }
  return shuffle(picked).slice(0, n);
}

// Hata defteri için kelime listesi (yanlış sayısı > 0)
// Hata Defteri: yalnız KULLANICININ ŞUANKİ SEVİYESİNDEKİ hatalı kelimeler.
// Veri SİLİNMEZ — diğer seviyelerdeki hatalar wordStats'te kalır, kullanıcı
// o seviyeye dönünce tekrar görünür (SM-2 ilerlemesi de korunur).
function getMistakeWords() {
  const lv = userLevel();
  return Object.entries(store.wordStats)
    .filter(([, s]) => s.wrong > 0)
    .map(([k, s]) => {
      const w = WORDS.find(x => x.en.toLowerCase() === k);
      return w && wordLevel(w) === lv ? { word: w, stats: s } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.stats.wrong - a.stats.wrong);
}

function refreshStats() {
  rollDailyCounters();
  // Üst bar
  const sv = $('#streakValue'); if (sv) sv.textContent = store.streak;
  const xv = $('#xpValue');     if (xv) xv.textContent = store.xp;
  renderHearts();

  // Ana ekran hızlı istatistik
  const qsW = $('#qsWords');    if (qsW) qsW.textContent = countLearnedWords();
  const qsA = $('#qsAccuracy'); if (qsA) qsA.textContent = `%${accuracy()}`;
  const qsS = $('#qsStreak');   if (qsS) qsS.textContent = store.streak;

  // SM-2 — tekrar zamanı gelen kelime varsa banner aç (sayı gösterilmez)
  const dueBanner = $('#dueBanner');
  if (dueBanner) {
    const due = countDueToday();
    dueBanner.style.display = (due > 0 && store.totalAnswered > 0) ? 'flex' : 'none';
  }

  // Günlük hedef
  const goal = store.dailyGoal;
  const done = Math.min(store.todayAnswered, goal);
  const pct = Math.round((done / goal) * 100);
  const gs = $('#goalSub');  if (gs) gs.textContent = `${done} / ${goal} soru tamamlandı`;
  const gp = $('#goalPct');  if (gp) gp.textContent = `${pct}%`;
  const gf = $('#goalFill'); if (gf) gf.style.width = `${pct}%`;

  // Karşılama altyazısı
  const gsub = $('#greetingSub');
  if (gsub) {
    const remaining = Math.max(goal - done, 0);
    gsub.textContent = remaining > 0
      ? `Günlük hedef için ${remaining} soru kaldı.`
      : `Günlük hedefini tamamladın 🎉`;
  }

  // Profil — stats grid
  const pS = $('#profStreak');   if (pS) pS.textContent = store.streak;
  const pW = $('#profWords');    if (pW) pW.textContent = countLearnedWords();
  const pX = $('#profXp');       if (pX) pX.textContent = store.xp;
  const pA = $('#profAccuracy'); if (pA) pA.textContent = `%${accuracy()}`;

  // Profil — seviye barı + XP'ye kalan
  const lv = getLevelFromXp(store.xp || 0);
  const plc = $('#profLevelCurrent'); if (plc) plc.textContent = `Seviye ${lv.level}`;
  const pln = $('#profLevelNext');    if (pln) pln.textContent = `Seviye ${lv.level + 1}`;
  const plf = $('#profLevelFill');    if (plf) plf.style.width = `${lv.progress}%`;
  const plh = $('#profLevelHint');
  if (plh) {
    plh.textContent = lv.remaining > 0
      ? `Bir sonraki seviyeye ${lv.remaining} XP kaldı`
      : 'Maksimum seviyedesin 🎉';
  }

  // Profil — alt satır (level + streak'e göre durum)
  const ps = $('#profSub');
  if (ps) {
    const xp = store.xp || 0;
    let label;
    if (xp === 0)               label = 'Yeni başladı';
    else if (lv.level <= 2)     label = 'Yolu açıldı';
    else if (lv.level <= 5)     label = 'İlerliyor';
    else if (lv.level <= 10)    label = 'Adanmış öğrenci';
    else                        label = 'Uzman';
    if (store.streak >= 7)      label += ` · ${store.streak} gün seri 🔥`;
    ps.textContent = label;
  }

  // Oyunlar menüsü — hata defteri kartının kelime sayısı
  const mm = $('#mistakesMeta');
  if (mm) {
    const c = Object.values(store.wordStats).filter(s => s.wrong > 0).length;
    mm.textContent = `${c} kelime`;
  }
}

// ---------- GÜNÜN İLHAM CÜMLELERI (kilit ekranı tarzı) ----------
// Her cümlede vurgulanan kelime (mark) = günün kelimesi.
// Vurgulanan kelime WORDS dizisinde geçen bir kelime olmalı ki
// telaffuz/çeviri otomatik eşleşsin.
// QUOTES dizisi -> kelimoli-data.js (refactor: veri/mantik ayrimi)

// ---------- SITCOM SAHNELERI ----------
// videoId = YouTube URL'sindeki v=XXX kısmı.
// Bir video yayından kalkmışsa, embed alanında "Video unavailable" yazar —
// YouTube'da o sahneyi ara, yeni ID'yi al, aşağıdaki videoId alanına yapıştır.
// SORU TİPİ: artık tek kelime değil, tüm cümle/kalıp anlamı sorulur.
// SCENES dizisi -> kelimoli-data.js (refactor: veri/mantik ayrimi)

// ---------- OYUN DURUMU (geçici / oturum içi) ----------
const state = {
  quiz: { idx: 0, total: 5, queue: [], correct: 0, selected: null },
  exam: { idx: 0, total: 10, queue: [], correct: 0, selected: null, locked: false },
  verbs: { idx: 0, total: 10, queue: [], correct: 0, selected: null, locked: false, ask: 'v2', mode: 'mc' },
  order: { idx: 0, total: 10, queue: [], correct: 0, locked: false, built: [], bank: [] },
  flash: { idx: 0, total: 10, queue: [] },
  match: { selected: null, matched: 0, pairs: [] },
  movie: { idx: 0, total: 3, queue: [], correct: 0, selected: null, timer: null, seconds: 15 },
  listen: { idx: 0, total: 5, queue: [], correct: 0, attempts: 0 },
  ff: { idx: 0, total: 5, queue: [], correct: 0, answered: false },
  story: { story: null, sceneIdx: 0, correct: 0, total: 0, answered: false },
};

// ---------- YARDIMCILAR ----------
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  document.querySelector(`.screen[data-screen="${name}"]`)?.classList.add('active');
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.target === name));

  const topBar = $('#topBar');
  const bottomNav = $('#bottomNav');
  const fullscreenGames = ['movie', 'quiz', 'exam', 'verbs', 'order', 'match', 'onboarding', 'listen', 'false-friends', 'stories-menu', 'story', 'leaderboard', 'paywall'];
  const hideChrome = fullscreenGames.includes(name);
  topBar.style.display = (hideChrome || name === 'flash') ? 'none' : 'flex';
  const hideNav = ['movie', 'onboarding', 'listen', 'false-friends', 'stories-menu', 'story', 'leaderboard', 'paywall'];
  const navVisible = !hideNav.includes(name);
  bottomNav.style.display = navVisible ? 'flex' : 'none';
  // Nav'ın gerçek yüksekliğini CSS değişkenine yaz — screen-quiz / screen-mistakes
  // `height: calc(100% - var(--bottom-nav-h))` ile bunu okuyor, böylece footer butonu
  // (Cevabı Kontrol Et) cihazın safe-area inset'ine göre nav'a yapışmadan oturuyor.
  if (navVisible) {
    // Nav yüksekliği + flex/padding kaynaklı ~6px üst offset için tampon → footer
    // alt-nav'la çakışmasın. Boşluk safe-area inset (iPhone home indicator) için
    // de yedek payı bırakıyor.
    const h = bottomNav.offsetHeight + 16;
    if (h > 0) document.documentElement.style.setProperty('--bottom-nav-h', `${h}px`);
  }

  // Banner reklam — alt nav görünen ekranlarda göster, tam ekran oyunlarda gizle
  // (Premium kullanıcıda hiç gösterilmez — syncBanner içinde kontrol edilir)
  try { if (typeof Ads !== 'undefined' && Ads.syncBanner) Ads.syncBanner(name, navVisible); } catch (e) {}
  // Firebase Analytics screen_view — retention/funnel için kritik. Firebase
  // resmi event şeması: screen_name + screen_class.
  try { if (window.Cloud && Cloud.logEvent) Cloud.logEvent('screen_view', { screen_name: name, screen_class: name }); } catch (e) {}

  // Oyun başlıklarındaki kalp göstergelerini güncelle
  renderHearts();

  // Profil ekranına geçince rozetleri, hesap kartı, leaderboard banner'ı yenile
  if (name === 'profile') {
    refreshStats();          // profil istatistikleri her zaman güncel olsun
    applyUserToUI();
    renderProfileLevel();
    renderAchievementsList();
    refreshAccountUI();
    refreshLeaderboardBanner();
    refreshPremiumBanner();
  }
}

// ---------- TELAFFUZ (TTS) ----------
// Android WebView'in speechSynthesis'i cihazda ses olsa bile çoğu zaman boş
// liste döndürür. Bu yüzden native ortamda @capacitor-community/text-to-speech
// plugin'ini (cihazın gerçek TTS motoru) kullanıyoruz; web'de Web Speech API'ye
// düşüyoruz.
let _ttsVoices = [];
function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  try { _ttsVoices = window.speechSynthesis.getVoices() || []; } catch (e) { _ttsVoices = []; }
}
if ('speechSynthesis' in window) {
  loadVoices();
  try { window.speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) {}
}
function pickEnglishVoice() {
  if (!_ttsVoices.length) loadVoices();
  return _ttsVoices.find(v => /^en[-_]US/i.test(v.lang))
      || _ttsVoices.find(v => /^en/i.test(v.lang))
      || null;
}
// Native TTS plugin'i var mı (yalnızca Android/iOS)
function hasNativeTTS() {
  const cap = window.Capacitor;
  if (!cap || !cap.Plugins || !cap.Plugins.TextToSpeech) return false;
  return typeof cap.isNativePlatform === 'function' ? cap.isNativePlatform() : !!cap.isNative;
}
function speak(text) {
  // 1) Native TTS — cihazın gerçek motoru (WebView speechSynthesis'i baypas eder)
  if (hasNativeTTS()) {
    const TTS = window.Capacitor.Plugins.TextToSpeech;
    (async () => {
      try { await TTS.stop(); } catch (e) {}
      try {
        await TTS.speak({
          text: String(text),
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
      } catch (e) { console.warn('[Kelimoli] Native TTS hata:', e); }
    })();
    return;
  }
  // 2) Web fallback (tarayıcı / PWA)
  if (!('speechSynthesis' in window)) { console.warn('[Kelimoli] Bu cihazda speechSynthesis yok'); return; }
  const doSpeak = () => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = pickEnglishVoice();
      if (v) u.voice = v;
      u.lang = (v && v.lang) || 'en-US';
      u.rate = 0.92;
      u.onerror = (e) => console.warn('[Kelimoli] TTS hata:', e.error || e);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { console.warn('[Kelimoli] speak hata:', e); }
  };
  if (!_ttsVoices.length) {
    loadVoices();
    if (!_ttsVoices.length) {
      let done = false;
      const once = () => { if (done) return; done = true; loadVoices(); doSpeak(); };
      try { window.speechSynthesis.addEventListener('voiceschanged', once, { once: true }); } catch (e) {}
      setTimeout(once, 350); // bazı WebView'ler voiceschanged tetiklemez — yine de dene
      return;
    }
  }
  doSpeak();
}

// ---------- BUGÜN TARIHI ----------
function setTodayDate() {
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const days = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const d = new Date();
  const el = $('#todayDate');
  if (el) el.textContent = `${d.getDate()} ${months[d.getMonth()]} ${days[d.getDay()]}`;
}

// ---------- BUGÜNÜN İLHAMI + KELİMESİ ----------
function findWord(en) {
  const target = en.trim().toLowerCase();
  return WORDS.find(w => w.en.toLowerCase() === target);
}
function setWordOfDay() {
  // Günün sözü — TARİHE GÖRE deterministik: aynı gün aynı söz, gün değişince
  // yenilenir. Kullanıcının "o günün şanslı cümlesi" hissini verir.
  const idx = dailyQuestSeed(todayStr()) % QUOTES.length;
  const q = QUOTES[idx];
  const fromList = findWord(q.word);
  const w = {
    en: q.word,
    ph: q.word_ph || (fromList && fromList.ph) || '',
    tr: q.word_tr || (fromList && fromList.tr) || '',
  };

  const elQuote = $('#wodQuote');
  const elQuoteTr = $('#wodQuoteTr');
  if (elQuote)   elQuote.innerHTML   = q.en;
  if (elQuoteTr) elQuoteTr.textContent = q.tr;

  $('#wodEn').textContent = w.en;
  $('#wodPh').textContent = w.ph || '';
  $('#wodTr').textContent = w.tr || '';

  // Telaffuz: önce kelime, sonra tüm cümle dinlenebilir
  const speakBtn = $('#wodSpeak');
  if (speakBtn) speakBtn.onclick = () => speak(w.en);

  const speakQuoteBtn = $('#wodSpeakQuote');
  if (speakQuoteBtn) {
    // mark etiketlerini sıyırıp düz metin oku
    const plain = q.en.replace(/<[^>]+>/g, '');
    speakQuoteBtn.onclick = () => speak(plain);
  }
}

// ---------- NAV ----------
// Oyun ortasında alt menüye basınca onay sor (ilerleme kaybolmasın).
// Bu ekranlarda yarıda kalan bir tur vardır; doğrudan geçiş ilerlemeyi siler.
const IN_GAME_SCREENS = new Set([
  'quiz', 'exam', 'verbs', 'order', 'match', 'flash',
  'listen', 'movie', 'story', 'false-friends',
]);
function navTo(target) {
  if (target === 'flash') startFlashcards();
  else showScreen(target);
}
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.target;
    const active = document.querySelector('.screen.active')?.dataset.screen;
    if (IN_GAME_SCREENS.has(active) && active !== t) {
      // Yarıda kalan oyun var — önce onay iste
      showConfirm({
        title: 'Oyundan çık?',
        message: 'Çıkarsan bu turdaki ilerlemen kaybolacak.',
        confirmText: 'Çık',
        cancelText: 'Devam et',
        danger: true,
        onConfirm: () => navTo(t),
        // onCancel: hiçbir şey yapma — oyunda kal
      });
    } else {
      navTo(t);
    }
  });
});

// ---------- HOME quick games ----------
$$('.qg-card[data-action]').forEach(c => {
  c.addEventListener('click', () => triggerGame(c.dataset.action));
});
$$('.game-card[data-action]').forEach(c => {
  c.addEventListener('click', () => triggerGame(c.dataset.action));
});
function triggerGame(action) {
  if (action === 'quiz')           startQuiz();
  if (action === 'exam')           startExam();
  if (action === 'verbs')          startVerbs();
  if (action === 'order')          startOrder();
  if (action === 'match')          startMatch();
  if (action === 'flash')          startFlashcards();
  if (action === 'movie')          startMovie();
  if (action === 'mistakes')       openMistakes();
  if (action === 'listen')         startListen();
  if (action === 'false-friends')  startFalseFriends();
  if (action === 'stories')        openStoriesMenu();
}

// =====================================================================
// HATA DEFTERİ EKRANI
// =====================================================================
function openMistakes() {
  renderMistakes();
  showScreen('mistakes');
}
function renderMistakes() {
  const list = getMistakeWords();
  const wrap = $('#mistakesList');
  const intro = $('#mistakesIntro');
  const studyBtn = $('#mistakesStudy');

  if (intro) {
    intro.textContent = list.length === 0
      ? `Henüz yanlış yaptığın kelime yok. Pratik yap, buraya gelirler.`
      : `${list.length} kelimede zorlanıyorsun. Önce bunları halletmek seri'ni hızla büyütür.`;
  }
  if (studyBtn) {
    studyBtn.disabled = list.length === 0;
    studyBtn.style.opacity = list.length === 0 ? '0.5' : '1';
  }

  if (!wrap) return;
  wrap.innerHTML = '';
  if (list.length === 0) return;

  list.forEach(({ word, stats }) => {
    const total = stats.correct + stats.wrong;
    const wrongPct = Math.round((stats.wrong / total) * 100);
    const row = document.createElement('div');
    row.className = 'mistake-row';
    row.innerHTML = `
      <div class="mistake-info">
        <div class="mistake-en">${word.en}</div>
        <div class="mistake-tr">${word.tr}</div>
        <div class="mistake-stats">
          <span class="mistake-stat wrong">✕ ${stats.wrong}</span>
          <span class="mistake-stat correct">✓ ${stats.correct}</span>
          <span class="mistake-stat soft">%${wrongPct} yanlış</span>
        </div>
      </div>
      <button class="ghost-btn ghost-btn-sm mistake-speak" type="button">
        <span class="speaker">▶</span> Dinle
      </button>
    `;
    row.querySelector('.mistake-speak').addEventListener('click', (e) => {
      e.stopPropagation();
      speak(word.en);
    });
    wrap.appendChild(row);
  });

  // Games menüsündeki kart altyazısı
  const meta = $('#mistakesMeta');
  if (meta) meta.textContent = `${list.length} kelime`;
}

// =====================================================================
// QUIZ
// =====================================================================
function startQuiz() {
  if (!ensureHearts()) return;
  state.quiz.total = 10;
  state.quiz.queue = pickStudyWords(state.quiz.total);
  state.quiz.idx = 0;
  state.quiz.correct = 0;
  state.quiz.selected = null;
  state.quiz.outOfHearts = false;
  showScreen('quiz');
  renderQuiz();
}

// Hata defteri quiz'i — yalnızca yanlış yapılan kelimelerle
function startMistakeQuiz() {
  const mistakes = getMistakeWords().map(m => m.word);
  if (mistakes.length === 0) return;
  if (!ensureHearts()) return;
  state.quiz.queue = shuffle(mistakes).slice(0, Math.min(10, mistakes.length));
  state.quiz.total = state.quiz.queue.length;
  state.quiz.idx = 0;
  state.quiz.correct = 0;
  state.quiz.selected = null;
  state.quiz.outOfHearts = false;
  showScreen('quiz');
  renderQuiz();
}

function renderQuiz() {
  const q = state.quiz;
  const w = q.queue[q.idx];
  if (!w) return finishQuiz();

  $('#quizPrompt').textContent = `Aşağıdaki kelimenin Türkçesi nedir?`;
  $('#quizWord').textContent = w.en;
  $('#quizPhonetic').textContent = w.ph;
  { const ql = $('#quizLevel'); if (ql) ql.textContent = wordTag(w); }
  $('#quizCounter').textContent = `${q.idx + 1} / ${q.total}`;
  $('#quizProgressFill').style.width = `${(q.idx / q.total) * 100}%`;

  const wrongs = shuffle(getActivePool().filter(x => x.en !== w.en)).slice(0, 3);
  const opts = shuffle([w, ...wrongs]);
  const letters = ['A','B','C','D'];

  const wrap = $('#quizOptions');
  wrap.innerHTML = '';
  opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'option';
    b.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${o.tr}</span>`;
    b.dataset.correct = o.en === w.en ? '1' : '0';
    b.addEventListener('click', () => {
      $$('.option').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      q.selected = b;
      $('#quizCheck').disabled = false;
      Feedback.tap();
    });
    wrap.appendChild(b);
  });
  $('#quizCheck').disabled = true;
}

$('#quizCheck').addEventListener('click', () => {
  const q = state.quiz;
  if (!q.selected) return;
  const correct = q.selected.dataset.correct === '1';
  const askedWord = q.queue[q.idx];
  $$('.option').forEach(o => {
    o.disabled = true;
    if (o.dataset.correct === '1') o.classList.add('correct');
    else if (o === q.selected) o.classList.add('wrong');
  });
  recordAnswer(askedWord && askedWord.en, correct);
  if (correct) { q.correct++; addXP(XP.quizCorrect); Feedback.correct(); showResult(true, `+${XP.quizCorrect} XP kazandın`); }
  else {
    loseHeart();
    Feedback.wrong();
    if (!isUnlimitedHearts() && (store.hearts ?? 0) <= 0) {
      q.outOfHearts = true;
      showResult(false, 'Kalbin kalmadı! Bu turu burada bitiriyoruz.');
    } else {
      showResult(false, 'Doğru cevap işaretlendi');
    }
  }
});
$('#quizClose').addEventListener('click', () => confirmExitGame('home'));
$('#speakBtn').addEventListener('click', () => {
  const w = state.quiz.queue[state.quiz.idx];
  if (w) speak(w.en);
});
function finishQuiz() {
  const q = state.quiz;
  let earned = q.correct * XP.quizCorrect;
  if (q.total >= 5 && q.correct === q.total) {
    addXP(XP.perfectBonus); // hatasız tur bonusu
    earned += XP.perfectBonus;
    bumpCounter('perfectQuizzes');
    bumpQuestMetric('perfectQuizzes');
    checkAchievements();
  }
  if (window.Cloud) Cloud.logEvent('finish_quiz', { correct: q.correct, total: q.total });
  showResult(true, '', true, { correct: q.correct, total: q.total, xp: earned });
  // Result overlay açıldıktan sonra interstitial (premium değilse, her 3. quiz'de 1)
  setTimeout(() => { Ads.maybeShowInterstitial(); }, 1500);
}

// =====================================================================
// SINAV MODU — akademik sınav kelimelerini öğretici test
// Kalp tüketmez (öğrenme odaklı). Her cevaptan sonra anlam + örnek cümle +
// dürüst sınav betimlemesi gösterilir. Sahte "şu sınavda çıktı" verisi YOK.
// =====================================================================
const EXAM_NOTE = 'YDS · YÖKDİL · IELTS · TOEFL · YKS-Dil gibi akademik sınavların ortak kelime havuzunda sık karşına çıkar.';

// Akademik kelime havuzu: seviye-bağımsız — sınav her seviyede aynı
// akademik havuzu kullanır (YDS/YÖKDİL/IELTS/TOEFL ortak listesi).
function examWordPool() {
  return WORDS.filter(w => w.exam === 'Akademik');
}

function startExam() {
  const pool = examWordPool();
  state.exam.total = Math.min(10, pool.length);
  state.exam.queue = shuffle(pool).slice(0, state.exam.total);
  state.exam.idx = 0;
  state.exam.correct = 0;
  state.exam.selected = null;
  state.exam.locked = false;
  showScreen('exam');
  renderExam();
}

function renderExam() {
  const q = state.exam;
  const w = q.queue[q.idx];
  if (!w) return finishExam();
  q.selected = null;
  q.locked = false;

  $('#examWord').textContent = w.en;
  $('#examPhonetic').textContent = w.ph || '';
  { const el = $('#examLevel'); if (el) el.textContent = wordTag(w); }
  $('#examCounter').textContent = `${q.idx + 1} / ${q.total}`;
  $('#examProgressFill').style.width = `${(q.idx / q.total) * 100}%`;

  // öğretici panel + Devam gizle, Kontrol Et göster
  $('#examTeach').setAttribute('hidden', '');
  const next = $('#examNext'); if (next) next.hidden = true;
  const check = $('#examCheck'); if (check) { check.hidden = false; check.disabled = true; }

  const wrongs = shuffle(getActivePool().filter(x => x.en !== w.en)).slice(0, 3);
  const opts = shuffle([w, ...wrongs]);
  const letters = ['A', 'B', 'C', 'D'];
  const wrap = $('#examOptions');
  wrap.innerHTML = '';
  opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'option';
    b.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${o.tr}</span>`;
    b.dataset.correct = o.en === w.en ? '1' : '0';
    b.addEventListener('click', () => {
      if (q.locked) return;
      wrap.querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      q.selected = b;
      $('#examCheck').disabled = false;
      Feedback.tap();
    });
    wrap.appendChild(b);
  });
}

function checkExam() {
  const q = state.exam;
  if (q.locked || !q.selected) return;
  q.locked = true;
  const w = q.queue[q.idx];
  const correct = q.selected.dataset.correct === '1';
  $('#examOptions').querySelectorAll('.option').forEach(o => {
    o.disabled = true;
    if (o.dataset.correct === '1') o.classList.add('correct');
    else if (o === q.selected) o.classList.add('wrong');
  });
  recordAnswer(w && w.en, correct);
  if (correct) { q.correct++; addXP(XP.examCorrect); Feedback.correct(); }
  else { Feedback.wrong(); }

  // Öğretici panel: anlam + örnek cümle + dürüst sınav betimlemesi
  $('#examTeachEn').textContent = w.en;
  $('#examTeachTr').textContent = w.tr;
  $('#examExEn').textContent = w.ex_en || '';
  $('#examExTr').textContent = w.ex_tr || '';
  $('#examExamNote').textContent = EXAM_NOTE;
  $('#examTeach').removeAttribute('hidden');

  $('#examCheck').hidden = true;
  const next = $('#examNext'); next.hidden = false; next.textContent = (q.idx >= q.total - 1) ? 'Sonuçları gör' : 'Devam';
}

function nextExam() {
  const q = state.exam;
  q.idx++;
  if (q.idx >= q.total) finishExam();
  else renderExam();
}

function finishExam() {
  const q = state.exam;
  // Genel istatistik + günlük görev (answered/correct) recordAnswer içinde
  // her cevapta işlendi; burada tur bonusu + tur tamamlama sayacı + sonuç.
  let earned = q.correct * XP.examCorrect;
  if (q.total >= 5 && q.correct === q.total) {
    addXP(XP.perfectBonus);
    earned += XP.perfectBonus;
  }
  bumpCounter('examsCompleted');     // başarım sayacı
  bumpQuestMetric('examGames');      // günlük görev "1 sınav modu bitir"
  checkAchievements();
  if (window.Cloud) Cloud.logEvent('finish_exam', { correct: q.correct, total: q.total });
  showResult(true, '', true, { correct: q.correct, total: q.total, xp: earned });
}

$('#examClose')?.addEventListener('click', () => confirmExitGame('games'));
$('#examSpeakBtn')?.addEventListener('click', () => {
  const w = state.exam.queue[state.exam.idx];
  if (w) speak(w.en);
});
$('#examCheck')?.addEventListener('click', () => checkExam());
$('#examNext')?.addEventListener('click', () => nextExam());

// =====================================================================
// DÜZENSİZ FİİLLER — öğretici alıştırma (V1 → V2 → V3)
// Fiilin yalın hâli gösterilir, V2 (geçmiş) veya V3 (partisip) sorulur.
// Cevaptan sonra üç hâl + Türkçesi öğretici tabloda gösterilir.
// b: yalın (V1), v2: geçmiş, v3: partisip, tr: Türkçe.
// =====================================================================
// IRREGULAR_VERBS dizisi -> kelimoli-data.js (refactor: veri/mantik ayrimi)

// Düzgün fiil çekimi (yanlış şık üretmek için): -ed eki
function regularizeVerb(base) {
  return base.endsWith('e') ? base + 'd' : base + 'ed';
}
// Tüm V2/V3 hâlleri (çeldirici havuzu)
const VERB_FORM_POOL = (() => {
  const set = new Set();
  IRREGULAR_VERBS.forEach(v => { set.add(v.v2); set.add(v.v3); });
  return [...set];
})();

function startVerbs(preMode) {
  showScreen('verbs');
  if (preMode) beginVerbsRound(preMode);
  else showVerbsChooser();
}

function showVerbsChooser() {
  $('#verbsChoose')?.removeAttribute('hidden');
  $('#verbsPlay')?.setAttribute('hidden', '');
  $('#verbsPlayFooter')?.setAttribute('hidden', '');
  // Seçili hâl (V2/V3) pilini senkronla
  const cur = state.verbs.form === 'v3' ? 'v3' : 'v2';
  $$('#verbsFormSeg .vseg-opt').forEach(x => x.classList.toggle('active', x.dataset.vform === cur));
}

function beginVerbsRound(mode) {
  state.verbs.mode = mode === 'type' ? 'type' : 'mc';
  state.verbs.total = Math.min(20, IRREGULAR_VERBS.length);
  state.verbs.queue = shuffle(IRREGULAR_VERBS.slice()).slice(0, state.verbs.total);
  state.verbs.idx = 0;
  state.verbs.correct = 0;
  state.verbs.selected = null;
  state.verbs.locked = false;
  $('#verbsChoose')?.setAttribute('hidden', '');
  $('#verbsPlay')?.removeAttribute('hidden');
  $('#verbsPlayFooter')?.removeAttribute('hidden');
  renderVerbs();
}

function renderVerbs() {
  const q = state.verbs;
  const v = q.queue[q.idx];
  if (!v) return finishVerbs();
  q.selected = null;
  q.locked = false;
  q.ask = q.form === 'v3' ? 'v3' : 'v2';   // tur boyunca seçilen hâl sorulur
  const correct = v[q.ask];

  $('#verbsBase').textContent = v.b;
  $('#verbsTr').textContent = v.tr;
  $('#verbsPrompt').textContent = q.ask === 'v2'
    ? 'Geçmiş zaman (V2 · Past) hâli nedir?'
    : 'Üçüncü hâl (V3 · Past Participle) nedir?';
  $('#verbsCounter').textContent = `${q.idx + 1} / ${q.total}`;
  $('#verbsProgressFill').style.width = `${(q.idx / q.total) * 100}%`;

  $('#verbsTeach').setAttribute('hidden', '');
  { const y = $('#verbsYour'); if (y) { y.setAttribute('hidden', ''); y.classList.remove('ok-close'); } }
  const next = $('#verbsNext'); if (next) next.hidden = true;
  const check = $('#verbsCheck'); if (check) { check.hidden = false; check.disabled = true; }

  const typeMode = q.mode === 'type';
  const optsWrap = $('#verbsOptions');
  const typeWrap = $('#verbsTypeWrap');
  const input = $('#verbsInput');

  if (typeMode) {
    optsWrap.hidden = true;
    optsWrap.innerHTML = '';
    typeWrap.hidden = false;
    input.value = '';
    input.disabled = false;
    input.classList.remove('correct', 'wrong');
    setTimeout(() => { try { input.focus(); } catch (e) {} }, 50);
  } else {
    typeWrap.hidden = true;
    optsWrap.hidden = false;
    // Seçenekler: doğru + düzgün-çekim (yanlış) + diğer fiillerden 2 hâl
    const optsSet = new Set([correct]);
    const reg = regularizeVerb(v.b);
    if (reg !== correct) optsSet.add(reg);
    for (const f of shuffle(VERB_FORM_POOL.filter(x => x !== correct && x !== reg && x !== v.b))) {
      if (optsSet.size >= 4) break;
      optsSet.add(f);
    }
    const opts = shuffle([...optsSet]).slice(0, 4);
    const letters = ['A', 'B', 'C', 'D'];
    optsWrap.innerHTML = '';
    opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'option';
      b.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${o}</span>`;
      b.dataset.correct = o === correct ? '1' : '0';
      b.addEventListener('click', () => {
        if (q.locked) return;
        optsWrap.querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        q.selected = b;
        $('#verbsCheck').disabled = false;
        Feedback.tap();
      });
      optsWrap.appendChild(b);
    });
  }
}

function renderVerbForms(v, ask) {
  const cell = (form, label, key) =>
    `<span class="vf-cell ${ask === key ? 'vf-hl' : ''}"><b>${form}</b><small>${label}</small></span>`;
  $('#verbsForms').innerHTML =
    `<div class="verb-forms-row">` +
      cell(v.b, 'Yalın · V1', 'v1') +
      `<span class="vf-arrow">→</span>` +
      cell(v.v2, 'Geçmiş · V2', 'v2') +
      `<span class="vf-arrow">→</span>` +
      cell(v.v3, 'Partisip · V3', 'v3') +
    `</div>` +
    `<div class="verb-forms-tr">${v.tr}</div>`;
}

function checkVerbs() {
  const q = state.verbs;
  if (q.locked) return;
  const v = q.queue[q.idx];
  const correctForm = v[q.ask];
  let isCorrect;

  if (q.mode === 'type') {
    const input = $('#verbsInput');
    const typed = (input.value || '').trim();
    if (!typed) return;
    // Tolerans: tam isabet = doğru; 1 harf hata (uzun formda 2) = kabul ama doğrusunu göster
    const a = typed.toLowerCase();
    const target = correctForm.toLowerCase();
    const dist = levenshtein(a, target);
    const tol = target.length >= 8 ? 2 : 1;
    const exact = dist === 0;
    const close = dist > 0 && dist <= tol;
    isCorrect = exact || close;
    input.disabled = true;
    input.classList.toggle('correct', isCorrect);
    input.classList.toggle('wrong', !isCorrect);
    const your = $('#verbsYour');
    your.classList.remove('ok-close');
    if (!isCorrect) {
      your.textContent = `Senin cevabın: ${typed}`;
      your.removeAttribute('hidden');
    } else if (close) {
      your.textContent = `Küçük yazım hatası — doğrusu: ${correctForm}`;
      your.classList.add('ok-close');
      your.removeAttribute('hidden');
    }
  } else {
    if (!q.selected) return;
    isCorrect = q.selected.dataset.correct === '1';
    $('#verbsOptions').querySelectorAll('.option').forEach(o => {
      o.disabled = true;
      if (o.dataset.correct === '1') o.classList.add('correct');
      else if (o === q.selected) o.classList.add('wrong');
    });
  }

  q.locked = true;
  // Kelime havuzu dışı (fiil hâlleri) olduğundan recordAnswer yerine
  // recordActivity: doğruluk %, seri, görev ve başarımlara sayılır;
  // SM-2/hata defterini kirletmez.
  recordActivity(isCorrect);
  if (isCorrect) { q.correct++; addXP(XP.verbCorrect); Feedback.correct(); }
  else { Feedback.wrong(); }

  renderVerbForms(v, q.ask);
  $('#verbsTeach').removeAttribute('hidden');
  $('#verbsCheck').hidden = true;
  const next = $('#verbsNext'); next.hidden = false;
  next.textContent = (q.idx >= q.total - 1) ? 'Sonuçları gör' : 'Devam';
}

function nextVerbs() {
  const q = state.verbs;
  q.idx++;
  if (q.idx >= q.total) finishVerbs();
  else renderVerbs();
}

function finishVerbs() {
  const q = state.verbs;
  // answered/correct + seri her cevapta recordActivity ile işlendi.
  let earned = q.correct * XP.verbCorrect;
  if (q.total >= 5 && q.correct === q.total) {
    addXP(XP.perfectBonus);
    earned += XP.perfectBonus;
  }
  bumpCounter('verbsCompleted');     // başarım sayacı
  bumpQuestMetric('verbsGames');     // günlük görev "1 fiil turu bitir"
  checkAchievements();
  if (window.Cloud) Cloud.logEvent('finish_verbs', { correct: q.correct, total: q.total });
  showResult(true, '', true, { correct: q.correct, total: q.total, xp: earned });
}

// Mod seçimi: önce hâl (V2/V3), sonra çalışma şekli (çoktan seçmeli / elle yazma)
$('#verbsChoose')?.addEventListener('click', (e) => {
  const fb = e.target.closest('[data-vform]');
  if (fb) {
    state.verbs.form = fb.dataset.vform === 'v3' ? 'v3' : 'v2';
    $$('#verbsFormSeg .vseg-opt').forEach(x => x.classList.toggle('active', x === fb));
    Feedback.tap();
    return;
  }
  const mb = e.target.closest('[data-vmode]');
  if (mb) { Feedback.tap(); beginVerbsRound(mb.dataset.vmode); }
});
$('#verbsClose')?.addEventListener('click', () => {
  // Mod seçimindeyken ilerleme yok — direkt çık; oyundaysa onayla
  if ($('#verbsPlay')?.hasAttribute('hidden')) showScreen('games');
  else confirmExitGame('games');
});
$('#verbsSpeakBtn')?.addEventListener('click', () => {
  const v = state.verbs.queue[state.verbs.idx];
  if (v) speak(v.b);
});
$('#verbsCheck')?.addEventListener('click', () => checkVerbs());
$('#verbsNext')?.addEventListener('click', () => nextVerbs());
// Elle yazma: input doluysa Kontrol Et aktif; Enter ile gönder/ilerle
$('#verbsInput')?.addEventListener('input', () => {
  $('#verbsCheck').disabled = !($('#verbsInput').value.trim());
});
$('#verbsInput')?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (!$('#verbsNext').hidden) nextVerbs();
  else if (!$('#verbsCheck').disabled) checkVerbs();
});

// =====================================================================
// CÜMLE SIRALAMA — kelimeleri doğru sıraya dizerek cümle kurma (öğretici)
// Cümleler havuzdaki hazır örnek cümlelerden (ex_en/ex_tr) süzülür — uydurma yok.
// =====================================================================
// Sıralamaya uygun cümle havuzu: 4-8 kelime, virgül/rakam/tırnak vb. içermeyen.
function buildOrderPool(words) {
  const seen = new Set();
  const pool = [];
  for (const w of words) {
    const raw = (w.ex_en || '').trim();
    const tr = (w.ex_tr || '').trim();
    if (!raw || !tr) continue;
    const core = raw.replace(/[.!?]+$/, '').trim();          // sondaki noktalama
    if (/[,;:"“”()/\d–—\-]/.test(core)) continue;            // karmaşık karakterleri ele
    const tokens = core.split(/\s+/);
    if (tokens.length < 4 || tokens.length > 10) continue;
    const key = core.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push({ tokens, displayEn: raw, tr });
  }
  return pool;
}
function orderSentencePool() {
  let pool = buildOrderPool(getActivePool());
  if (pool.length < 10) pool = buildOrderPool(WORDS);   // düşük seviyede yetmezse tüm havuz
  return pool;
}

// Tur kuyruğu: cümleler kısa→uzun ilerlesin (sona doğru zorlaşsın).
// Havuzu uzunluğa göre sıralayıp n eşit dilime böler, her dilimden rastgele
// bir cümle seçer → hem kademeli artan uzunluk hem turlar arası çeşitlilik.
function pickProgressiveOrder(pool, n) {
  const sorted = pool.slice().sort((a, b) => a.tokens.length - b.tokens.length);
  if (sorted.length <= n) return sorted;
  const picked = [];
  const seg = sorted.length / n;
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * seg);
    const end = Math.max(Math.floor((i + 1) * seg), start + 1);
    const slice = sorted.slice(start, end);
    picked.push(slice[Math.floor(Math.random() * slice.length)]);
  }
  return picked; // zaten kısa→uzun sıralı
}

function startOrder() {
  const pool = orderSentencePool();
  if (!pool.length) { showScreen('games'); return; }
  state.order.total = Math.min(10, pool.length);
  state.order.queue = pickProgressiveOrder(pool, state.order.total);
  state.order.idx = 0;
  state.order.correct = 0;
  state.order.locked = false;
  showScreen('order');
  renderOrder();
}

function renderOrder() {
  const o = state.order;
  const item = o.queue[o.idx];
  if (!item) return finishOrder();
  o.locked = false;
  $('#orderTr').textContent = item.tr;
  $('#orderCounter').textContent = `${o.idx + 1} / ${o.total}`;
  $('#orderProgressFill').style.width = `${(o.idx / o.total) * 100}%`;
  $('#orderTeach').setAttribute('hidden', '');
  $('#orderNext').hidden = true;
  const check = $('#orderCheck'); check.hidden = false; check.disabled = true;

  // Token'ları {id,text} yap, bankayı karıştır (orijinal sırayla aynı olmasın)
  const toks = item.tokens.map((t, i) => ({ id: i, text: t }));
  let scrambled = shuffle(toks.slice());
  if (toks.length > 1) {
    let guard = 0;
    while (scrambled.map(t => t.id).join(',') === toks.map(t => t.id).join(',') && guard++ < 12) {
      scrambled = shuffle(toks.slice());
    }
  }
  o.built = [];
  o.bank = scrambled;
  renderOrderChips();
}

function renderOrderChips() {
  const o = state.order;
  const ans = $('#orderAnswer');
  const bank = $('#orderBank');
  ans.innerHTML = '';
  bank.innerHTML = '';
  o.built.forEach((t, i) => {
    const c = document.createElement('button');
    c.className = 'order-chip in-answer';
    c.textContent = t.text;
    c.addEventListener('click', () => {
      if (o.locked) return;
      o.built.splice(i, 1);
      o.bank.push(t);
      renderOrderChips();
      updateOrderCheck();
      Feedback.tap();
    });
    ans.appendChild(c);
  });
  o.bank.forEach((t, i) => {
    const c = document.createElement('button');
    c.className = 'order-chip';
    c.textContent = t.text;
    c.addEventListener('click', () => {
      if (o.locked) return;
      o.bank.splice(i, 1);
      o.built.push(t);
      renderOrderChips();
      updateOrderCheck();
      Feedback.tap();
    });
    bank.appendChild(c);
  });
  ans.classList.toggle('empty', o.built.length === 0);
}

function updateOrderCheck() {
  const o = state.order;
  $('#orderCheck').disabled = o.locked || o.bank.length !== 0 || o.built.length === 0;
}

function checkOrder() {
  const o = state.order;
  if (o.locked || o.bank.length !== 0 || !o.built.length) return;
  o.locked = true;
  const item = o.queue[o.idx];
  const user = o.built.map(t => t.text).join(' ').toLowerCase();
  const target = item.tokens.join(' ').toLowerCase();
  const ok = user === target;
  $('#orderAnswer').querySelectorAll('.order-chip').forEach(c => {
    c.disabled = true;
    c.classList.add(ok ? 'correct' : 'wrong');
  });
  // Cümle dizilimi tek kelimeye bağlanmaz → recordActivity (genel istatistik).
  recordActivity(ok);
  if (ok) { o.correct++; addXP(XP.orderCorrect); Feedback.correct(); }
  else { Feedback.wrong(); }

  $('#orderCorrect').textContent = item.displayEn;
  $('#orderCorrectTr').textContent = item.tr;
  $('#orderTeach').removeAttribute('hidden');
  $('#orderCheck').hidden = true;
  const next = $('#orderNext'); next.hidden = false;
  next.textContent = (o.idx >= o.total - 1) ? 'Sonuçları gör' : 'Devam';
}

function nextOrder() {
  const o = state.order;
  o.idx++;
  if (o.idx >= o.total) finishOrder();
  else renderOrder();
}

function finishOrder() {
  const o = state.order;
  // answered/correct + seri her cevapta recordActivity ile işlendi.
  let earned = o.correct * XP.orderCorrect;
  if (o.total >= 5 && o.correct === o.total) {
    addXP(XP.perfectBonus);
    earned += XP.perfectBonus;
  }
  bumpCounter('ordersCompleted');    // başarım sayacı
  bumpQuestMetric('orderGames');     // günlük görev "1 cümle sıralama bitir"
  checkAchievements();
  if (window.Cloud) Cloud.logEvent('finish_order', { correct: o.correct, total: o.total });
  showResult(true, '', true, { correct: o.correct, total: o.total, xp: earned });
}

$('#orderClose')?.addEventListener('click', () => confirmExitGame('games'));
$('#orderCheck')?.addEventListener('click', () => checkOrder());
$('#orderNext')?.addEventListener('click', () => nextOrder());

// =====================================================================
// RESULT OVERLAY
// =====================================================================
function showResult(ok, msg, isFinal = false, summary = null) {
  const ov = $('#resultOverlay');
  // Tur sonu hiçbir zaman kırmızı "başarısız" ekranı değildir
  ov.classList.toggle('wrong', !isFinal && !ok);
  ov.classList.add('show');

  if (isFinal && summary) {
    const correct = summary.correct || 0;
    const total = summary.total || 0;
    const xp = summary.xp || 0;
    const wrong = Math.max(0, total - correct);
    const perfect = total > 0 && correct === total;
    const good = correct >= Math.ceil(total / 2);
    $('#resultIcon').textContent = perfect ? '🎉' : (good ? '👍' : '💪');
    $('#resultTitle').textContent = perfect ? 'Mükemmel!' : (good ? 'Tur tamamlandı' : 'Tur bitti');
    $('#resultMsg').innerHTML =
      `<div class="result-summary">` +
        `<div class="result-summary-row">` +
          `<span class="rs-correct">✓ ${correct} doğru</span>` +
          `<span class="rs-wrong">✕ ${wrong} yanlış</span>` +
        `</div>` +
        (xp > 0 ? `<div class="result-summary-xp">+${xp} XP</div>` : '') +
      `</div>`;
    launchConfetti();
  } else if (isFinal) {
    // Özet objesi olmayan tur sonu (flash / story) — yine kutlama tarzı
    $('#resultIcon').textContent = '🎉';
    $('#resultTitle').textContent = 'Tur tamamlandı';
    $('#resultMsg').textContent = msg;
    launchConfetti();
  } else {
    $('#resultIcon').textContent = ok ? '✓' : '✕';
    $('#resultTitle').textContent = ok ? 'Doğru' : 'Yanlış';
    $('#resultMsg').textContent = msg;
    if (ok) launchConfetti();
  }

  const continueBtn = $('#resultContinue');
  const finalActions = $('#resultFinalActions');

  if (isFinal) {
    // Tur sonu: "Tekrar oyna" + "Oyundan çık"
    if (continueBtn) continueBtn.style.display = 'none';
    if (finalActions) finalActions.style.display = '';
    const active = document.querySelector('.screen.active')?.dataset.screen;
    const replayFns = {
      quiz: startQuiz,
      exam: startExam,
      verbs: () => startVerbs(state.verbs.mode || 'mc'),
      order: startOrder,
      listen: startListen,
      movie: startMovie,
      flash: startFlashcards,
      story: () => { const id = state.story.story && state.story.story.id; if (id) startStory(id); else showScreen('stories-menu'); },
    };
    const exitTargets = { quiz: 'home', exam: 'games', verbs: 'games', order: 'games', listen: 'games', movie: 'home', flash: 'home', story: 'stories-menu' };
    $('#resultReplay').onclick = () => {
      ov.classList.remove('show');
      const fn = replayFns[active];
      if (fn) fn(); else showScreen(exitTargets[active] || 'home');
    };
    $('#resultExit').onclick = () => {
      ov.classList.remove('show');
      showScreen(exitTargets[active] || 'home');
    };
    return;
  }

  // Soru arası: tek "Devam Et" butonu
  if (continueBtn) continueBtn.style.display = '';
  if (finalActions) finalActions.style.display = 'none';
  continueBtn.onclick = () => {
    ov.classList.remove('show');
    const active = document.querySelector('.screen.active')?.dataset.screen;
    if (active === 'quiz') {
      if (state.quiz.outOfHearts) {
        state.quiz.outOfHearts = false;
        showScreen('home');
        showHeartsModal();
        return;
      }
      state.quiz.idx++;
      if (state.quiz.idx >= state.quiz.total) finishQuiz();
      else renderQuiz();
    } else if (active === 'movie') {
      state.movie.idx++;
      if (state.movie.idx >= state.movie.total) finishMovie();
      else renderMovie();
    }
  };
}

// =====================================================================
// MATCH
// =====================================================================
function startMatch() {
  const sample = shuffle(getActivePool()).slice(0, 5);
  state.match.pairs = sample;
  state.match.matched = 0;
  state.match.selected = null;

  const cells = shuffle([
    ...sample.map(w => ({ kind: 'en', word: w })),
    ...sample.map(w => ({ kind: 'tr', word: w })),
  ]);

  const grid = $('#matchGrid');
  grid.innerHTML = '';
  cells.forEach(c => {
    const el = document.createElement('button');
    el.className = 'match-cell';
    el.textContent = c.kind === 'en' ? c.word.en : c.word.tr;
    el.dataset.id = c.word.en;
    el.dataset.kind = c.kind;
    el.addEventListener('click', () => onMatchClick(el));
    grid.appendChild(el);
  });
  showScreen('match');
}
function onMatchClick(el) {
  if (el.classList.contains('matched')) return;
  if (state.match.selected === el) {
    el.classList.remove('selected');
    state.match.selected = null;
    return;
  }
  if (!state.match.selected) {
    el.classList.add('selected');
    state.match.selected = el;
    return;
  }
  const a = state.match.selected, b = el;
  if (a.dataset.id === b.dataset.id && a.dataset.kind !== b.dataset.kind) {
    a.classList.remove('selected');
    a.classList.add('matched');
    b.classList.add('matched');
    state.match.matched++;
    state.match.selected = null;
    Feedback.match();
    if (state.match.matched === state.match.pairs.length) {
      const pairs = state.match.pairs.length;
      state.match.pairs.forEach(w => recordAnswer(w.en, true));
      const earned = XP.matchPair * pairs;
      addXP(earned);
      bumpQuestMetric('matchGames');
      Feedback.levelUp();
      setTimeout(() => showResult(true, '', true, { correct: pairs, total: pairs, xp: earned }), 300);
    }
  } else {
    a.classList.remove('selected');
    a.classList.add('mismatch');
    b.classList.add('mismatch');
    state.match.selected = null;
    Feedback.mismatch();
    setTimeout(() => {
      a.classList.remove('mismatch');
      b.classList.remove('mismatch');
    }, 550);
  }
}
$('#matchClose').addEventListener('click', () => confirmExitGame('games'));

// Hata defteri ekranı butonları
$('#mistakesClose').addEventListener('click', () => showScreen('games'));
$('#mistakesStudy').addEventListener('click', () => {
  if (getMistakeWords().length > 0) startMistakeQuiz();
});

// =====================================================================
// DİNLE & YAZ — TTS ile kelime okunur, kullanıcı yazar
// 1-2 harf yanlışlığı kabul edilir (Levenshtein tolerance).
// İlk denemede doğruysa +30 XP, 2. denemede +15.
// =====================================================================
function startListen() {
  if (!ensureHearts()) return;
  state.listen.xp = 0;
  // Tek heceli/çok kısa kelimeleri yazma testinde kullanma — ayrıca cümle değil tek kelimeler
  const active = getActivePool();
  const candidates = active.filter(w => /^[A-Za-z' -]{3,18}$/.test(w.en) && !w.en.includes(' '));
  // Yetersizse boşluklu kelimeleri de al
  const pool = candidates.length >= 20 ? candidates : active.filter(w => w.en.length <= 22);
  state.listen.queue = pickListenWords(pool, state.listen.total);
  state.listen.idx = 0;
  state.listen.correct = 0;
  state.listen.attempts = 0;
  showScreen('listen');
  renderListen();
}

// Zayıf kelimelere ağırlık ver — pickStudyWords ile aynı mantık, ama listen havuzundan
function pickListenWords(pool, n) {
  const weighted = pool.map(w => ({ word: w, weight: weaknessScore(w.en) + 0.3 }));
  const picked = [];
  for (let i = 0; i < n && weighted.length > 0; i++) {
    const sum = weighted.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * sum;
    let idx = 0;
    for (let j = 0; j < weighted.length; j++) {
      r -= weighted[j].weight;
      if (r <= 0) { idx = j; break; }
    }
    picked.push(weighted[idx].word);
    weighted.splice(idx, 1);
  }
  return picked;
}

function renderListen() {
  const L = state.listen;
  const w = L.queue[L.idx];
  if (!w) return finishListen();

  $('#listenCounter').textContent = `${L.idx + 1} / ${L.total}`;
  $('#listenProgressFill').style.width = `${(L.idx / L.total) * 100}%`;
  $('#listenHint').textContent = `İpucu: "${w.tr}"`;
  $('#listenInput').value = '';
  $('#listenInput').disabled = false;
  $('#listenInput').classList.remove('right', 'wrong');
  $('#listenFeedback').textContent = '';
  $('#listenFeedback').className = 'listen-feedback';
  $('#listenCheck').disabled = true;
  $('#listenCheck').textContent = 'Kontrol Et';
  L.attempts = 0;
  setTimeout(() => speak(w.en), 250);
  setTimeout(() => $('#listenInput').focus(), 350);
}

// Levenshtein — küçük yazım yanlışı toleransı için
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + c);
    }
  }
  return dp[m][n];
}

function normalize(s) {
  return String(s || '').trim().toLowerCase().replace(/[''`]/g, "'").replace(/\s+/g, ' ');
}

function checkListenAnswer() {
  const L = state.listen;
  const w = L.queue[L.idx];
  if (!w) return;
  const userRaw = $('#listenInput').value;
  const user = normalize(userRaw);
  const target = normalize(w.en);
  if (!user) return;

  // Tolerans: 0 hata = mükemmel, 1 hata = kabul ama uyarı, 2+ = yanlış (uzun kelimelerde 2 kabul)
  const dist = levenshtein(user, target);
  const tol = target.length >= 8 ? 2 : 1;
  const exact = dist === 0;
  const close = dist > 0 && dist <= tol;
  const ok = exact || close;

  $('#listenInput').disabled = true;
  L.attempts++;

  if (ok) {
    $('#listenInput').classList.add('right');
    const fb = $('#listenFeedback');
    fb.classList.add('ok');
    if (exact) {
      fb.textContent = `Tam isabet! Doğru yazılışı: ${w.en}`;
    } else {
      fb.innerHTML = `Sayılır 👍 Doğru yazılışı: <strong>${w.en}</strong>`;
    }
    const earned = L.attempts === 1 ? (exact ? XP.listenExact : XP.listenClose) : XP.listenSecond;
    addXP(earned);
    L.xp = (L.xp || 0) + earned;
    // SM-2 quality: ilk denemede tam isabet=5, yakındı=4, 2. denemede=3
    const q = L.attempts === 1 ? (exact ? 5 : 4) : 3;
    recordAnswer(w.en, true, { quality: q });
    L.correct++;
    Feedback.correct();
    $('#listenCheck').textContent = 'Sonraki ›';
    $('#listenCheck').disabled = false;
    $('#listenCheck').onclick = nextListen;
  } else {
    $('#listenInput').classList.add('wrong');
    const fb = $('#listenFeedback');
    fb.classList.add('bad');
    if (L.attempts === 1) {
      fb.innerHTML = `Az kaldı, tekrar dene.`;
      $('#listenInput').disabled = false;
      $('#listenInput').classList.remove('wrong');
      $('#listenInput').select();
      Feedback.wrong();
      setTimeout(() => speak(w.en), 150);
    } else {
      fb.innerHTML = `Doğrusu: <strong>${w.en}</strong>`;
      recordAnswer(w.en, false, { quality: 1 });
      loseHeart();
      Feedback.wrong();
      $('#listenCheck').textContent = 'Sonraki ›';
      $('#listenCheck').disabled = false;
      $('#listenCheck').onclick = nextListen;
    }
  }
}

function nextListen() {
  state.listen.idx++;
  if (state.listen.idx >= state.listen.total) finishListen();
  else renderListen();
}

function finishListen() {
  const L = state.listen;
  bumpQuestMetric('listenGames');
  showResult(true, '', true, { correct: L.correct, total: L.total, xp: L.xp || 0 });
}

// Wire up
$('#listenClose')?.addEventListener('click', () => confirmExitGame('games'));
$('#listenPlay')?.addEventListener('click', () => {
  const w = state.listen.queue[state.listen.idx];
  if (!w) return;
  speak(w.en);
  Feedback.tap();
  // Native TTS varsa uyarı gösterme (ses cihazın motorundan gelir)
  if (hasNativeTTS()) return;
  // Web'de ses yoksa kullanıcıyı bilgilendir
  loadVoices();
  const fb = $('#listenFeedback');
  if (fb && (!_ttsVoices.length || !pickEnglishVoice())) {
    fb.className = 'listen-feedback bad';
    fb.innerHTML = !_ttsVoices.length
      ? '🔇 Cihazda İngilizce telaffuz (Metin Okuma) yüklü değil. Ayarlar → Metin okuma çıkışı.'
      : '🔇 İngilizce ses paketi bulunamadı.';
  }
});
$('#listenInput')?.addEventListener('input', (e) => {
  $('#listenCheck').disabled = e.target.value.trim().length === 0;
  $('#listenCheck').onclick = checkListenAnswer;
  $('#listenInput').classList.remove('wrong', 'right');
});
$('#listenInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !$('#listenCheck').disabled) {
    e.preventDefault();
    $('#listenCheck').click();
  }
});
$('#listenSkip')?.addEventListener('click', () => {
  const w = state.listen.queue[state.listen.idx];
  if (!w) return;
  recordAnswer(w.en, false, { quality: 0 });
  $('#listenFeedback').innerHTML = `Doğrusu: <strong>${w.en}</strong>`;
  $('#listenFeedback').className = 'listen-feedback bad';
  $('#listenInput').value = w.en;
  $('#listenInput').disabled = true;
  $('#listenInput').classList.add('wrong');
  $('#listenCheck').textContent = 'Sonraki ›';
  $('#listenCheck').disabled = false;
  $('#listenCheck').onclick = nextListen;
});

// =====================================================================
// YANILTICI KELİMELER (False Friends) — Türk öğrencilerin tuzakları
// 3 seçenek: tr_yanlis (tuzak), tr_dogru (doğru), bir rastgele yanlış
// Yanlış cevap verince hem doğrusu hem yanlış sanılan açıklanır.
// =====================================================================
function startFalseFriends() {
  state.ff.queue = shuffle(FALSE_FRIENDS).slice(0, state.ff.total);
  state.ff.idx = 0;
  state.ff.correct = 0;
  state.ff.answered = false;
  showScreen('false-friends');
  renderFalseFriends();
}

function renderFalseFriends() {
  const F = state.ff;
  const item = F.queue[F.idx];
  if (!item) return finishFalseFriends();

  F.answered = false;
  $('#ffCounter').textContent = `${F.idx + 1} / ${F.total}`;
  $('#ffProgressFill').style.width = `${(F.idx / F.total) * 100}%`;
  $('#ffWord').textContent = item.en;
  $('#ffPhon').textContent = item.ph;
  $('#ffExplain').style.display = 'none';
  $('#ffNext').style.display = 'none';

  // 3 seçenek: doğru cevap + tuzak (yanlış sanılan) + uzaktan başka bir false friend'in doğru anlamı
  const others = FALSE_FRIENDS.filter(x => x.en !== item.en);
  const filler = others[Math.floor(Math.random() * others.length)].tr_dogru;
  const opts = shuffle([
    { text: item.tr_dogru,  kind: 'right' },
    { text: item.tr_yanlis, kind: 'trap' },
    { text: filler,         kind: 'wrong' },
  ]);

  // Şıkta parantez içi ipucu gösterme — "üretkenlik (industrious)" gibi notlar
  // hangi İngilizce kelimeye ait olduğunu ele verip cevabı sızdırıyor. Parantezsiz
  // göster; tam metin (ipucuyla) cevaptan SONRA açıklama panelinde öğretilir.
  const stripHint = (s) => String(s).replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  const wrap = $('#ffOptions');
  wrap.innerHTML = '';
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'ff-option';
    b.textContent = stripHint(o.text);
    b.dataset.kind = o.kind;
    b.addEventListener('click', () => onFFAnswer(b));
    wrap.appendChild(b);
  });
}

function onFFAnswer(btn) {
  const F = state.ff;
  if (F.answered) return;
  F.answered = true;
  const item = F.queue[F.idx];
  const kind = btn.dataset.kind;
  const isCorrect = kind === 'right';

  // Tüm butonları işaretle
  $$('#ffOptions .ff-option').forEach(b => {
    b.disabled = true;
    if (b.dataset.kind === 'right') b.classList.add('correct');
    else if (b === btn)             b.classList.add('wrong');
    if (b.dataset.kind === 'trap' && b !== btn) b.classList.add('trap-marker');
  });

  // Açıklama panelini göster
  $('#ffWrong').textContent = item.tr_yanlis;
  $('#ffRight').textContent = item.tr_dogru;
  $('#ffExEn').textContent = `"${item.ex_en}"`;
  $('#ffExTr').textContent = item.ex_tr;
  $('#ffExplain').style.display = 'block';
  $('#ffNext').style.display = 'block';

  if (isCorrect) {
    F.correct++;
    addXP(XP.falseFriend);
    Feedback.correct();
    recordAnswer(item.en, true);
  } else {
    Feedback.wrong();
    recordAnswer(item.en, false);
  }
  checkAchievements();
}

function nextFF() {
  state.ff.idx++;
  if (state.ff.idx >= state.ff.total) finishFalseFriends();
  else renderFalseFriends();
}

function finishFalseFriends() {
  const F = state.ff;
  showResult(F.correct >= Math.ceil(F.total * 0.6), `${F.correct}/${F.total} doğru · Tuzakları öğrendin`, true);
}

$('#ffClose')?.addEventListener('click', () => showScreen('games'));
$('#ffSpeak')?.addEventListener('click', () => {
  const item = state.ff.queue[state.ff.idx];
  if (item) { speak(item.en); Feedback.tap(); }
});
$('#ffNext')?.addEventListener('click', nextFF);

// =====================================================================
// HİKAYE / STORY — Mini interaktif senaryolar
// 3 sahne tipi: narration (sadece oku), choice (seçim), fill (boşluk doldur)
// =====================================================================
function openStoriesMenu() {
  const grid = $('#storiesGrid');
  if (grid) {
    const completed = store.storiesCompleted || {};
    const lv = userLevel();
    const visible = STORIES.filter(s => s.level === lv);
    if (visible.length === 0) {
      grid.innerHTML = `
        <div class="story-empty">
          <div class="story-empty-emoji">📚</div>
          <div class="story-empty-title">${lv} seviyesi için henüz hikaye yok</div>
          <div class="story-empty-desc">Seviyeni değiştirirsen yeni hikayeler açılır.</div>
        </div>
      `;
    } else {
      grid.innerHTML = visible.map(s => {
        const done = completed[s.id];
        return `
          <button class="story-tile ${done ? 'done' : ''}" data-story-id="${s.id}">
            <div class="story-tile-emoji">${s.emoji}</div>
            <div class="story-tile-info">
              <div class="story-tile-title">${s.title}</div>
              <div class="story-tile-desc">${s.desc}</div>
              <div class="story-tile-meta">
                <span class="story-level">${s.level}</span>
                <span class="story-xp">+${s.xp} XP</span>
                ${done ? '<span class="story-tick">✓ Bitti</span>' : ''}
              </div>
            </div>
            <span class="story-tile-arrow">›</span>
          </button>
        `;
      }).join('');
      grid.querySelectorAll('.story-tile').forEach(btn => {
        btn.addEventListener('click', () => {
          Feedback.tap();
          startStory(btn.dataset.storyId);
        });
      });
    }
  }
  showScreen('stories-menu');
}

function startStory(id) {
  const story = STORIES.find(s => s.id === id);
  if (!story) return;
  state.story.story = story;
  state.story.sceneIdx = 0;
  state.story.correct = 0;
  state.story.total = story.scenes.filter(sc => sc.type !== 'narration').length;
  state.story.answered = false;
  $('#storyEmoji').textContent = story.emoji;
  $('#storyTitle').textContent = story.title;
  showScreen('story');
  renderStoryScene();
}

function renderStoryScene() {
  const S = state.story;
  const story = S.story;
  if (!story) return;
  const scene = story.scenes[S.sceneIdx];
  if (!scene) return finishStory();

  $('#storyCounter').textContent = `${S.sceneIdx + 1} / ${story.scenes.length}`;
  $('#storyProgressFill').style.width = `${(S.sceneIdx / story.scenes.length) * 100}%`;
  $('#storyNext').style.display = 'none';
  $('#storyTrBody').style.display = 'none';
  $('#storyTrToggle').querySelector('span').textContent = 'Türkçesini göster';
  $('#storyTrBody').textContent = scene.tr || '';
  S.answered = false;

  const wrap = $('#storyScene');
  wrap.innerHTML = '';

  if (scene.type === 'narration') {
    const p = document.createElement('div');
    p.className = 'story-narration';
    p.textContent = scene.text;
    wrap.appendChild(p);
    // Sesli oku
    setTimeout(() => speak(scene.text), 200);
    $('#storyNext').style.display = 'block';
    $('#storyNext').textContent = 'Devam ›';
    $('#storyNext').onclick = nextStoryScene;

  } else if (scene.type === 'choice') {
    const q = document.createElement('div');
    q.className = 'story-question';
    q.textContent = scene.prompt;
    wrap.appendChild(q);
    setTimeout(() => speak(scene.prompt), 200);

    const opts = document.createElement('div');
    opts.className = 'story-options';
    scene.options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'story-option';
      b.textContent = opt.text;
      b.dataset.correct = opt.correct ? '1' : '0';
      b.dataset.hint = opt.hint || '';
      b.addEventListener('click', () => onStoryChoice(b, scene));
      opts.appendChild(b);
    });
    wrap.appendChild(opts);

  } else if (scene.type === 'fill') {
    // Cümle, "___" yerine input/seçilebilir slot
    const q = document.createElement('div');
    q.className = 'story-question';
    q.textContent = scene.prompt;
    wrap.appendChild(q);
    setTimeout(() => speak(scene.prompt.replace('___', 'blank')), 200);

    const slot = document.createElement('div');
    slot.className = 'story-fill-slot';
    slot.id = 'storyFillSlot';
    slot.textContent = '___';
    wrap.appendChild(slot);

    const bank = document.createElement('div');
    bank.className = 'story-bank';
    shuffle(scene.bank).forEach(word => {
      const chip = document.createElement('button');
      chip.className = 'story-chip';
      chip.textContent = word;
      chip.addEventListener('click', () => onStoryFill(chip, word, scene));
      bank.appendChild(chip);
    });
    wrap.appendChild(bank);
  }
}

function onStoryChoice(btn, scene) {
  const S = state.story;
  if (S.answered) return;
  S.answered = true;
  const correct = btn.dataset.correct === '1';
  $$('#storyScene .story-option').forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === '1') b.classList.add('correct');
    else if (b === btn)            b.classList.add('wrong');
  });
  // Hint balonu
  if (btn.dataset.hint) {
    const hint = document.createElement('div');
    hint.className = 'story-hint';
    hint.textContent = btn.dataset.hint;
    btn.parentElement.appendChild(hint);
  }
  if (correct) {
    S.correct++;
    addXP(XP.storyScene);
    Feedback.correct();
  } else {
    Feedback.wrong();
  }
  $('#storyNext').style.display = 'block';
  $('#storyNext').textContent = 'Devam ›';
  $('#storyNext').onclick = nextStoryScene;
}

function onStoryFill(chip, word, scene) {
  const S = state.story;
  if (S.answered) return;
  S.answered = true;
  const slot = $('#storyFillSlot');
  slot.textContent = word;
  slot.classList.add(word === scene.answer ? 'right' : 'wrong');
  $$('#storyScene .story-chip').forEach(c => {
    c.disabled = true;
    if (c.textContent === scene.answer) c.classList.add('correct');
    else if (c === chip)                c.classList.add('wrong');
  });
  if (word === scene.answer) {
    S.correct++;
    addXP(XP.storyScene);
    Feedback.correct();
  } else {
    Feedback.wrong();
  }
  $('#storyNext').style.display = 'block';
  $('#storyNext').textContent = 'Devam ›';
  $('#storyNext').onclick = nextStoryScene;
}

function nextStoryScene() {
  state.story.sceneIdx++;
  if (state.story.sceneIdx >= state.story.story.scenes.length) finishStory();
  else renderStoryScene();
}

function finishStory() {
  const S = state.story;
  const story = S.story;
  if (!store.storiesCompleted) store.storiesCompleted = {};
  store.storiesCompleted[story.id] = { date: Date.now(), correct: S.correct, total: S.total };
  const bonus = Math.max(0, (story.xp || 0) - XP.storyScene * S.total);
  if (bonus > 0) addXP(bonus);
  saveStore();
  Feedback.levelUp();
  if (window.Cloud) Cloud.logEvent('finish_story', { story_id: story.id, correct: S.correct, total: S.total });
  const earned = XP.storyScene * S.correct + bonus;
  showResult(true, '', true, { correct: S.correct, total: S.total, xp: earned });
}

$('#storiesMenuClose')?.addEventListener('click', () => showScreen('games'));
$('#storyClose')?.addEventListener('click', () => confirmExitGame('stories-menu'));
$('#storyTrToggle')?.addEventListener('click', () => {
  const body = $('#storyTrBody');
  const lbl = $('#storyTrToggle').querySelector('span');
  if (body.style.display === 'none') {
    body.style.display = 'block';
    lbl.textContent = 'Türkçeyi gizle';
  } else {
    body.style.display = 'none';
    lbl.textContent = 'Türkçesini göster';
  }
});

// =====================================================================
// FLASHCARDS
// =====================================================================
function startFlashcards() {
  state.flash.idx = 0;
  state.flash.queue = shuffle(getActivePool()).slice(0, state.flash.total);
  renderFlash();
  showScreen('flash');
}
function renderFlash() {
  const f = state.flash;
  const w = f.queue[f.idx];
  if (!w) {
    addXP(XP.flashSet);
    bumpQuestMetric('flashGames');
    showResult(true, `Kart seti tamam · +${XP.flashSet} XP`, true);
    return;
  }
  $('#flashWord').textContent = w.en;
  $('#flashPhonetic').textContent = w.ph;
  { const fl = $('#flashLevel'); if (fl) fl.textContent = wordTag(w); }
  $('#flashTranslation').textContent = w.tr;
  $('#flashExampleEn').textContent = `"${w.ex_en}"`;
  $('#flashExampleTr').textContent = w.ex_tr ? `"${w.ex_tr}"` : '';
  $('#flashCounter').textContent = `${f.idx + 1} / ${f.total}`;
  $('#flashProgress').style.width = `${(f.idx / f.total) * 100}%`;
  $('#flashcard').classList.remove('flipped');
}
// Kart üzerinde tıklama → çevir. Drag sonrası tetiklenmesin diye flag kontrolü.
let _flashDragJustEnded = false;
$('#flashcard').addEventListener('click', () => {
  if (_flashDragJustEnded) return;
  $('#flashcard').classList.toggle('flipped');
  Feedback.flip();
});

// =====================================================================
// SWIPE GESTURE — sağa fırlat: Biliyorum (yeşil, quality 5)
//                 sola fırlat: Bilmiyorum (kırmızı, quality 2 → hata defteri)
// Pointer events: hem mouse hem touch hem stylus tek API ile yönetilir.
// =====================================================================
(function setupFlashSwipe() {
  const card = $('#flashcard');
  if (!card) return;
  let startX = 0, startY = 0, deltaX = 0, deltaY = 0;
  let dragging = false;
  let pointerId = null;
  const THRESHOLD_DRAG = 6;      // 6px üstü hareket = drag
  const THRESHOLD_FLY = 0.30;    // kart genişliğinin %30'u → fırlat

  function fly(direction) {
    card.classList.remove('dragging','swipe-pos','swipe-neg');
    card.classList.add(direction === 'right' ? 'flying-right' : 'flying-left');
    Feedback.tap();
    const w = state.flash.queue[state.flash.idx];
    if (w) {
      const asCorrect = direction === 'right';
      recordAnswer(w.en, asCorrect, { quality: asCorrect ? 5 : 2 });
    }
    setTimeout(() => {
      card.classList.remove('flying-right','flying-left');
      card.style.transform = '';
      state.flash.idx++;
      renderFlash();
    }, 380);
  }

  card.addEventListener('pointerdown', (e) => {
    if (card.classList.contains('flying-right') || card.classList.contains('flying-left')) return;
    // Kart üstündeki butonlara (telaffuz vs.) tıklama → pointer akışını yakalamayalım,
    // yoksa setPointerCapture + click yönlendirmesi kart'ı döndürüyor.
    if (e.target.closest('button, .speak-btn, [data-icon]')) return;
    pointerId = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    deltaX = deltaY = 0;
    dragging = false;
    try { card.setPointerCapture(pointerId); } catch (err) {}
  });

  card.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId) return;
    deltaX = e.clientX - startX;
    deltaY = e.clientY - startY;
    if (!dragging && Math.hypot(deltaX, deltaY) > THRESHOLD_DRAG && Math.abs(deltaX) > Math.abs(deltaY)) {
      dragging = true;
      card.classList.add('dragging');
    }
    if (!dragging) return;
    const rot = deltaX / 24;
    card.style.transform = `translateX(${deltaX}px) rotate(${rot}deg)`;
    const ratio = deltaX / card.getBoundingClientRect().width;
    card.classList.toggle('swipe-pos', ratio > 0.08);
    card.classList.toggle('swipe-neg', ratio < -0.08);
  });

  function endDrag(e) {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    try { card.releasePointerCapture(pointerId); } catch (err) {}
    pointerId = null;
    if (!dragging) return;          // basit tıklama — click handler işler
    dragging = false;
    _flashDragJustEnded = true;
    setTimeout(() => { _flashDragJustEnded = false; }, 80);
    const ratio = deltaX / card.getBoundingClientRect().width;
    if (ratio > THRESHOLD_FLY) fly('right');
    else if (ratio < -THRESHOLD_FLY) fly('left');
    else {
      card.style.transform = '';
      card.classList.remove('dragging','swipe-pos','swipe-neg');
    }
  }
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
})();
$('#flashSpeak').addEventListener('click', (e) => {
  e.stopPropagation();
  const w = state.flash.queue[state.flash.idx];
  if (w) speak(w.en);
});
$('#flashClose').addEventListener('click', () => confirmExitGame('home'));

// =====================================================================
// SİNEMA SAHNESİ — yarışma modu
// =====================================================================
function startMovie() {
  // Sinema Sahnesi normalde premium-only. PREMIUM_FEATURE_AVAILABLE kapalıyken
  // herkese açık (premium yayını ertelendi — kullanıcı paywall'a çarpmasın).
  if (PREMIUM_FEATURE_AVAILABLE && !Premium.isPremium()) {
    Feedback.tap();
    showScreen('paywall');
    return;
  }
  if (!ensureHearts()) return;
  state.movie.queue = shuffle(SCENES).slice(0, state.movie.total);
  state.movie.idx = 0;
  state.movie.correct = 0;
  state.movie.selected = null;
  state.movie.locked = false;
  showScreen('movie');
  renderMovie();
}

function renderMovie() {
  const m = state.movie;
  const s = m.queue[m.idx];
  if (!s) return finishMovie();
  m.locked = false; // yeni sahne — kilit sıfırlanır

  $('#movieShow').textContent = `${s.show.toUpperCase()} · ${s.year}`;
  $('#movieCounter').textContent = `Soru ${m.idx + 1} / ${m.total}`;
  $('#vpSub').textContent = `${s.show} (${s.year})`;
  $('#subtitleText').innerHTML = s.subtitleHtml;
  $('#subtitleTr').textContent = s.subtitleTr;
  $('#subtitleTr').classList.remove('revealed');
  $('#mqText').innerHTML = s.question;

  // Sayaç henüz başlamasın — sahne bitince başlayacak
  clearInterval(state.movie.timer);
  $('#movieTimer').textContent = '—';
  $('#movieTimer').style.color = '';
  $('#movieTimer').style.borderColor = '';
  $('#movieTimer').classList.add('idle');

  // "Sıra sende" göstergesini gizle
  const turnHint = $('#yourTurnHint');
  if (turnHint) turnHint.classList.remove('visible');

  // ----- Video: ekran açılır açılmaz OTOMATİK oynat -----
  const ph = $('#videoPlaceholder');
  const errBox = $('#videoError');
  destroyYtPlayer();
  ph.classList.add('hidden');
  errBox.classList.add('hidden');

  // Poster sahnesi: tıklayınca YouTube açılır
  const openOnYT = (e) => {
    if (e) e.stopPropagation();
    if (s.videoId) window.open(`https://www.youtube.com/watch?v=${s.videoId}`, '_blank');
  };
  $('#veOpenBtn').onclick = openOnYT;
  $('#videoError').onclick = openOnYT; // tüm poster tıklanabilir
  $('#veSkipBtn').onclick = (e) => {
    e.stopPropagation();
    onSceneEnded();
  };
  // Caption + thumbnail
  $('#veCaption').textContent = `${s.show} · ${s.year}`;
  if (s.videoId) {
    $('#veThumb').src = `https://img.youtube.com/vi/${s.videoId}/maxresdefault.jpg`;
    $('#veThumb').onerror = () => {
      $('#veThumb').src = `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`;
    };
  }

  // Otomatik oynatmayı tetikle (API hazır olunca başlar)
  setTimeout(() => playScene(s), 250);

  // seçenekler
  const letters = ['A','B','C','D'];
  const wrap = $('#mqOptions');
  wrap.innerHTML = '';
  s.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'mq-option';
    b.innerHTML = `<span class="mq-option-letter">${letters[i]}</span><span>${opt}</span>`;
    b.dataset.idx = i;
    b.addEventListener('click', () => {
      $$('.mq-option').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      m.selected = b;
      $('#movieLockIn').disabled = false;
    });
    wrap.appendChild(b);
  });
  $('#movieLockIn').disabled = true;
  $('#movieLockIn').textContent = 'Cevabımı Kilitle';

  // geri sayım sayacı
  startMovieTimer();
}

// YouTube IFrame Player API
let ytPlayer = null;
let ytApiReady = false;
// API'nin "ready" callback'i kaçırılabilir (script app.js'ten önce yüklenmişse callback
// tanımlanmadan çağrılır). Bu yüzden hem callback'i kuruyoruz hem de YT.Player zaten
// erişilebiliyorsa flag'i hemen true yapıyoruz — iki yönden de güvenli.
window.onYouTubeIframeAPIReady = function() { ytApiReady = true; };
if (window.YT && window.YT.Player) ytApiReady = true;

function destroyYtPlayer() {
  if (ytPlayer) {
    try { ytPlayer.destroy(); } catch (e) {}
    ytPlayer = null;
  }
  // playerEl div'ini iframe ile değiştirilmiş olabilir → temiz div geri koy
  const wrap = $('#videoWrap');
  const old = $('#ytPlayer');
  if (old) old.remove();
  const fresh = document.createElement('div');
  fresh.id = 'ytPlayer';
  fresh.className = 'video-frame hidden';
  wrap.insertBefore(fresh, $('#videoError'));
}

let scenePollHandle = null;

function playScene(s) {
  const errBox = $('#videoError');
  const playerEl = $('#ytPlayer');

  errBox.classList.add('hidden');
  if (playerEl) playerEl.classList.remove('hidden');

  // YT.Player'ın varlığı asıl kriter — ytApiReady flag'ı kaçırılmış olabilir.
  if (!window.YT || !window.YT.Player) {
    setTimeout(() => playScene(s), 500);
    return;
  }
  ytApiReady = true; // Buraya gelinmişse API hazır.

  const videoId = (s.videoId && s.videoId.trim()) || '';
  if (!videoId) {
    showVideoError(s);
    return;
  }

  try {
    ytPlayer = new YT.Player('ytPlayer', {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        start: s.start || 0,
        end: s.end || undefined,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        controls: 1,
      },
      host: 'https://www.youtube-nocookie.com',
      events: {
        onError: () => onVideoFailed(s),
        onReady: (ev) => {
          try { ev.target.playVideo(); } catch (e) {}
        },
        onStateChange: (ev) => {
          // 1 = playing, 0 = ended, 2 = paused
          if (ev.data === 1 && s.end) {
            startScenePoll(ev.target, s.end);
          }
          if (ev.data === 0) {
            // Gerçekten oynadı mı kontrol et — hata maskeli "ended" gelmesin
            try {
              const dur = ev.target.getDuration();
              const t = ev.target.getCurrentTime();
              if (dur < 1 || t < 0.5) return; // hatalı end — yoksay
            } catch (e) { return; }
            stopScenePoll();
            onSceneEnded();
          }
        }
      },
    });
  } catch (e) {
    onVideoFailed(s);
  }
}

function startScenePoll(player, endTime) {
  stopScenePoll();
  scenePollHandle = setInterval(() => {
    try {
      const t = player.getCurrentTime();
      if (t >= endTime - 0.3) {
        stopScenePoll();
        try { player.pauseVideo(); } catch (e) {}
        onSceneEnded();
      }
    } catch (e) {}
  }, 400);
}
function stopScenePoll() {
  if (scenePollHandle) { clearInterval(scenePollHandle); scenePollHandle = null; }
}

function onVideoFailed(s) {
  // Spurious timer'ı durdur (yanlış başlamışsa)
  clearInterval(state.movie.timer);
  stopScenePoll();
  $('#movieTimer').textContent = '—';
  $('#movieTimer').classList.add('idle');
  $('#movieTimer').style.color = '';
  $('#movieTimer').style.borderColor = '';
  const turnHint = $('#yourTurnHint');
  if (turnHint) turnHint.classList.remove('visible');
  showVideoError(s);
}

function showVideoError(s) {
  const errBox = $('#videoError');
  const playerEl = $('#ytPlayer');
  if (playerEl) playerEl.classList.add('hidden');
  errBox.classList.remove('hidden');
}

// Sahne tamamlandı → "Sıra sende" göstergesi + sayaç başlat
function onSceneEnded() {
  // Geçerli sahne yoksa (tur bitti) ya da cevap kilitliyse sayaç başlatma
  if (!state.movie.queue[state.movie.idx] || state.movie.locked) return;
  const turnHint = $('#yourTurnHint');
  if (turnHint) turnHint.classList.add('visible');
  startMovieTimer();
}

function startMovieTimer() {
  clearInterval(state.movie.timer);
  state.movie.seconds = 20;
  const t = $('#movieTimer');
  t.classList.remove('idle');
  t.textContent = state.movie.seconds;
  t.style.color = '';
  t.style.borderColor = '';
  state.movie.timer = setInterval(() => {
    state.movie.seconds--;
    t.textContent = state.movie.seconds;
    if (state.movie.seconds <= 5) {
      t.style.color = '#EF4444';
      t.style.borderColor = '#EF4444';
    }
    if (state.movie.seconds <= 0) {
      clearInterval(state.movie.timer);
      lockInMovieAnswer(true);
    }
  }, 1000);
}

// Sayacı sıfırlamadan kaldığı saniyeden devam ettir (çıkış onayı iptal edilince)
function resumeMovieTimer() {
  clearInterval(state.movie.timer);
  const t = $('#movieTimer');
  if (!t || t.classList.contains('idle')) return; // sayaç aktif değildi
  if (state.movie.seconds == null || state.movie.seconds <= 0) return;
  state.movie.timer = setInterval(() => {
    state.movie.seconds--;
    t.textContent = state.movie.seconds;
    if (state.movie.seconds <= 5) { t.style.color = '#EF4444'; t.style.borderColor = '#EF4444'; }
    if (state.movie.seconds <= 0) { clearInterval(state.movie.timer); lockInMovieAnswer(true); }
  }, 1000);
}

function lockInMovieAnswer(timedOut = false) {
  clearInterval(state.movie.timer);
  stopScenePoll();
  const m = state.movie;
  const s = m.queue[m.idx];
  // Sahne yoksa (tur bitti / ekrandan çıkıldı) ya da zaten kilitlendiyse: çık.
  // Geç tetiklenen sayaç/video-bitiş olayları çökmesin.
  if (!s || m.locked) return;
  m.locked = true;
  const opts = $$('.mq-option');

  opts.forEach((o, i) => {
    o.disabled = true;
    if (i === s.correct) o.classList.add('correct');
    else if (o === m.selected) o.classList.add('wrong');
  });

  // altyazının Türkçesini göster
  $('#subtitleTr').classList.add('revealed');

  const userIdx = m.selected ? parseInt(m.selected.dataset.idx, 10) : -1;
  const correct = userIdx === s.correct;
  if (correct) { m.correct++; addXP(XP.movieCorrect); }
  else if (!timedOut) { loseHeart(); } // süre dolması (cevapsız) kalp götürmez

  setTimeout(() => {
    if (timedOut && !m.selected) {
      showResult(false, 'Süre doldu — doğru cevap işaretlendi');
    } else if (correct) {
      showResult(true, `+${XP.movieCorrect} XP · Sahne çözüldü!`);
    } else {
      showResult(false, 'Doğru cevap işaretlendi');
    }
  }, 900);
}

function finishMovie() {
  const m = state.movie;
  // Tur bitti — geç tetiklenebilecek sayaç/poll/video'yu durdur
  clearInterval(m.timer);
  stopScenePoll();
  destroyYtPlayer();
  const total = m.total;
  const correct = m.correct;
  let earned = correct * XP.movieCorrect;
  if (total >= 3 && correct === total) { addXP(XP.perfectBonus); earned += XP.perfectBonus; } // hatasız bonus
  bumpCounter('moviesCompleted');
  bumpQuestMetric('movieGames');
  checkAchievements();
  if (window.Cloud) Cloud.logEvent('finish_movie', { correct, total });
  showResult(true, '', true, { correct, total, xp: earned });
  setTimeout(() => { Ads.maybeShowInterstitial(); }, 1500);
}

$('#movieLockIn').addEventListener('click', () => lockInMovieAnswer(false));
$('#movieClose').addEventListener('click', () => {
  const wasIdle = $('#movieTimer')?.classList.contains('idle');
  clearInterval(state.movie.timer); // onay açıkken sayacı dondur
  confirmExitGame('home',
    () => { clearInterval(state.movie.timer); stopScenePoll(); destroyYtPlayer(); },
    () => { if (!wasIdle) resumeMovieTimer(); } // vazgeçerse kaldığı saniyeden devam
  );
});

// =====================================================================
// CONFETTI
// =====================================================================
const canvas = $('#confettiCanvas');
const ctx = canvas.getContext('2d');
let confettiPieces = [];

function resizeCanvas() {
  const screen = $('.device-screen');
  if (!screen) return;
  canvas.width = screen.clientWidth;
  canvas.height = screen.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 50);

const confettiColors = ['#1E3A8A','#B45309','#F59E0B','#047857','#0F172A','#FBBF24'];

// Cihaz profili: düşük RAM/çekirdek sayısında parça ve ömrü kısalt.
// deviceMemory bazı tarayıcılarda yok (undefined) → bilinmiyorsa yüksek profil say.
const _lowProfile =
  (navigator.deviceMemory && navigator.deviceMemory < 4) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
const CONFETTI_COUNT = _lowProfile ? 35 : 70;
const CONFETTI_LIFE  = _lowProfile ? 160 : 220;

function launchConfetti() {
  resizeCanvas();
  confettiPieces = [];
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    confettiPieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 80,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 9 - 3,
      g: 0.32,
      size: 3 + Math.random() * 5,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      // döndürme yerine hafif yatay sallanma: faz + frekans + genlik
      swayPhase: Math.random() * Math.PI * 2,
      swayFreq: 0.08 + Math.random() * 0.06,
      swayAmp: 0.6 + Math.random() * 1.2,
      life: 0,
    });
  }
  animateConfetti();
}
function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let alive = false;
  confettiPieces.forEach(p => {
    p.vy += p.g; p.y += p.vy; p.life++;
    // yatay hareket: temel hız + ucuz sinüs sallanma (rotate/save/restore yok)
    p.x += p.vx + Math.sin(p.swayPhase + p.life * p.swayFreq) * p.swayAmp;
    if (p.y < canvas.height + 30 && p.life < CONFETTI_LIFE) {
      alive = true;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.45);
    }
  });
  if (alive) requestAnimationFrame(animateConfetti);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// =====================================================================
// ONBOARDING
// =====================================================================
const ONB_TOTAL_STEPS = 6;
const onbState = {
  step: 1,
  reason: '',
  reasons: [],        // çoklu seçim — neden İngilizce öğreniyorsun
  goal: 10,
  level: null,        // kullanıcının seçtiği ya da testle bulunan seviye
  lvlIdx: 0,
  lvlCorrect: 0,
  lvlSelected: null,
  lvlLocked: false,
};

// Seviye yerleştirme test soruları (A1 → B1 karışık)
const LEVEL_TEST = [
  { en: 'Yes',         tr: 'Evet',           level: 'A1', distractors: ['Hayır', 'Merhaba', 'Lütfen'] },
  { en: 'Big',         tr: 'Büyük',          level: 'A1', distractors: ['Küçük', 'Yavaş', 'Sıcak'] },
  { en: 'Crowded',     tr: 'Kalabalık',      level: 'A2', distractors: ['Sessiz', 'Boş', 'Tehlikeli'] },
  { en: 'Suitcase',    tr: 'Valiz',          level: 'A2', distractors: ['Sırt çantası', 'Cüzdan', 'Şemsiye'] },
  { en: 'Resilience',  tr: 'Dayanıklılık',   level: 'B1', distractors: ['Cesaret', 'Bağışlama', 'Kararlılık'] },
  { en: 'Gratitude',   tr: 'Şükran, minnet', level: 'B1', distractors: ['Üzüntü', 'Merak', 'Sabır'] },
  { en: 'Inevitable',  tr: 'Kaçınılmaz',     level: 'B2', distractors: ['İsteğe bağlı', 'Geçici', 'Beklenmedik'] },
  { en: 'Ambiguous',   tr: 'Belirsiz, muğlak', level: 'B2', distractors: ['Açık ve net', 'Kesin', 'Basit'] },
];

function setOnbStep(n) {
  onbState.step = n;
  $$('.onb-step').forEach(s => s.classList.toggle('active', Number(s.dataset.step) === n));
  const fill = $('#onbProgressFill');
  if (fill) fill.style.width = `${Math.round((n / ONB_TOTAL_STEPS) * 100)}%`;

  // Seviye adımına girişte: testi otomatik başlatma — önce seçim panelini göster
  if (n === 4) {
    showOnbLvlChoice();
  }
}

// Step 4a — Seviye seçim panelini göster (test gizli)
function showOnbLvlChoice() {
  $('#onbLvlChoice')?.removeAttribute('hidden');
  $('#onbLvlChoiceFooter')?.removeAttribute('hidden');
  $('#onbLvlTest')?.setAttribute('hidden', '');
  $('#onbLvlTestFooter')?.setAttribute('hidden', '');
}

// Step 4b — Seviye testini başlat (seçim gizli)
function showOnbLvlTest() {
  onbState.lvlIdx = 0;
  onbState.lvlCorrect = 0;
  $('#onbLvlChoice')?.setAttribute('hidden', '');
  $('#onbLvlChoiceFooter')?.setAttribute('hidden', '');
  $('#onbLvlTest')?.removeAttribute('hidden');
  $('#onbLvlTestFooter')?.removeAttribute('hidden');
  renderLevelQuestion();
}

function onbNext() {
  // Step 2 (isim) — ileri gitmeden önce ismi doğrula (küfür/siyasi/dini reddedilir)
  if (onbState.step === 2) {
    const input = $('#onbName');
    const res = checkName(input ? input.value : '');
    const errEl = $('#onbNameError');
    if (!res.ok) {
      if (errEl) errEl.textContent = res.reason;
      if (input) input.classList.add('input-error');
      Feedback.wrong();
      return;
    }
    if (errEl) errEl.textContent = '';
    if (input) { input.classList.remove('input-error'); input.value = input.value.trim(); }
  }
  if (onbState.step < ONB_TOTAL_STEPS) setOnbStep(onbState.step + 1);
}
function onbBack() {
  if (onbState.step > 1) setOnbStep(onbState.step - 1);
}

// =====================================================================
// İSİM FİLTRESİ — küfür / hakaret / siyasi / dini provokasyon reddedilir.
// İsim ligde herkese görünür. Gerçek Türkçe isimleri (Musa, İsa, Yusuf...)
// engellememek için: güçlü/uzun ifadeler her yerde, kısa/belirsizler yalnız tam kelime.
// =====================================================================
// Uzun ve net ifadeler — isim içinde herhangi bir yerde geçerse engelle
const NAME_BAD_SUBSTR = [
  // küfür/hakaret (TR)
  'yarrak','yarak','orospu','oruspu','siktir','sikiyim','sikim','sikis','sikik','amcik','amina',
  'aminako','pezevenk','pezevek','kahpe','kahbe','kaltak','serefsiz','puşt','pust','gavat','godoş','godos',
  'oç','oc','amk','amına','sürtük','surtuk','yavşak','yavsak','ananı','anani','anan','bok',
  'ibne','piç','pic','göt','got','aq','salak','aptal','gerizekal','gerizekali','şıllık','sillik','mal',
  // İngilizce
  'fuck','shit','bitch','asshole','pussy','cunt','whore','slut','nigger','nigga','bastard','dick',
  'porn','rape','penis','vagina','sex','fag','gay','fck','wtf',
  // siyasi provokasyon
  'erdogan','erdoğan','ataturk','atatürk','kilicdaroglu','kılıçdaroğlu','hitler','stalin','mussolini',
  // terör/örgüt
  'pkk','feto','fetö','daes','daeş','deas','isid','işid','elkaide',
  // dini provokasyon (gerçek isim OLMAYANLAR — Allah/Tanrı isim olarak konulmamalı,
  // ama Musa/İsa/Yusuf gibi peygamber isimleri GERÇEK isim olduğu için filtrelenmez)
  'allah','peygamber','kuran','islamiyet','cennet','cehennem','şeytan','seytan','kafir','gavur','haçlı','hacli',
  'tanrı','tanri',
];
// Kısa/belirsiz — yalnız tam kelime olarak eşleşirse engelle (normal isimleri vurmaz)
// Not: 'meme'/'am' gibileri Memet/Amine içinde gömülü geçer → SUBSTR'ye taşınamaz.
// 'mal' SUBSTR'ye taşındı (gömülü argo kullanımını da yakalamak için) — false-positive
// olmaması için yaygın Türk isimleri NAME_WHITELIST_SUBSTR'da önce arınır.
const NAME_BAD_WORD = new Set([
  'am','sik','top','sg','dl','döl','dol','meme','akp','chp','mhp','hdp',
]);
// İsmin içinden bu parçalar çıkarıldıktan sonra kötü kelime taraması yapılır.
// Böylece "Kemal"/"Cemal"/"Kemalettin"/"Cemalcan" gibi gerçek isimler 'mal'
// substring kontrolüne yakalanmaz; ama "Zeymalnep"/"asikmaln" gibi diziler yakalanır.
const NAME_WHITELIST_SUBSTR = ['kemal', 'cemal'];
function _normName(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    // Türkçe karakterleri ASCII'ye katla — "şerefsiz" de "serefsiz" gibi yakalansın
    .replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/İ/g, 'i')
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/[^a-z0-9 ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// { ok, reason } döndürür
function checkName(name) {
  const n = _normName(name);
  if (n.length < 2) return { ok: false, reason: 'İsim en az 2 karakter olmalı.' };
  if (n.replace(/[^a-z]/g, '').length < 2) return { ok: false, reason: 'Lütfen geçerli bir isim gir.' };
  const collapsed = n.replace(/\s+/g, '');
  // 3+ aynı harf yan yana ("zeyneppp", "aaaa") — gerçek isimlerde olmaz, filtre atlatma denemesidir
  if (/(.)\1\1/.test(collapsed)) {
    return { ok: false, reason: 'Lütfen geçerli bir isim gir.' };
  }
  // SUBSTR kontrolünden ÖNCE: yaygın Türk isim parçalarını (kemal/cemal) çıkar.
  // Böylece içlerinde geçen 'mal' substring'i false-positive olmaz.
  let nStripped = n, collapsedStripped = collapsed;
  for (const w of NAME_WHITELIST_SUBSTR) {
    nStripped = nStripped.split(w).join(' ');
    collapsedStripped = collapsedStripped.split(w).join('');
  }
  for (const bad of NAME_BAD_SUBSTR) {
    if (nStripped.includes(bad) || collapsedStripped.includes(bad.replace(/\s+/g, ''))) {
      return { ok: false, reason: 'Bu isim uygun değil — lütfen başka bir isim seç.' };
    }
  }
  for (const word of n.split(' ')) {
    if (NAME_BAD_WORD.has(word)) {
      return { ok: false, reason: 'Bu isim uygun değil — lütfen başka bir isim seç.' };
    }
  }
  return { ok: true };
}

// Step 2 — İsim girişi
function bindOnbName() {
  const input = $('#onbName');
  const next = $('#onbNameNext');
  if (!input || !next) return;
  input.addEventListener('input', () => {
    next.disabled = input.value.trim().length < 2;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !next.disabled) onbNext();
  });
}

// Step 3 — Sebep seçimi (çoklu seçim — kullanıcı birden fazla neden seçebilir)
function bindOnbReason() {
  const list = $('#onbReasonList');
  const next = $('#onbReasonNext');
  if (!list || !next) return;
  if (!Array.isArray(onbState.reasons)) onbState.reasons = [];
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.onb-opt');
    if (!btn) return;
    const reason = btn.dataset.reason;
    const i = onbState.reasons.indexOf(reason);
    if (i >= 0) { onbState.reasons.splice(i, 1); btn.classList.remove('selected'); }
    else        { onbState.reasons.push(reason);  btn.classList.add('selected'); }
    next.disabled = onbState.reasons.length === 0;
  });
}

// Step 4 — Seviye testi
function renderLevelQuestion() {
  onbState.lvlSelected = null;
  onbState.lvlLocked = false;
  const q = LEVEL_TEST[onbState.lvlIdx];
  $('#onbLvlCounter').textContent = `Seviye Testi ${onbState.lvlIdx + 1}/${LEVEL_TEST.length}`;
  $('#onbLvlWord').textContent = q.en;
  const ph = WORDS.find(w => w.en.toLowerCase() === q.en.toLowerCase());
  $('#onbLvlPh').textContent = ph ? ph.ph : '';

  const options = shuffle([q.tr, ...q.distractors]);
  const wrap = $('#onbLvlOptions');
  wrap.innerHTML = '';
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'onb-opt';
    btn.innerHTML = `<div class="onb-opt-text"><div class="onb-opt-name">${opt}</div></div>`;
    btn.addEventListener('click', () => selectLevelAnswer(btn, opt, q.tr));
    wrap.appendChild(btn);
  });
  $('#onbLvlNext').disabled = true;
}

function selectLevelAnswer(btn, picked, correct) {
  if (onbState.lvlLocked) return;
  onbState.lvlLocked = true;
  const isCorrect = picked === correct;
  if (isCorrect) onbState.lvlCorrect++;

  const allBtns = $('#onbLvlOptions').querySelectorAll('.onb-opt');
  allBtns.forEach(b => {
    b.disabled = true;
    const label = b.querySelector('.onb-opt-name').textContent;
    if (label === correct) b.classList.add('correct');
    else if (b === btn && !isCorrect) b.classList.add('wrong');
  });
  $('#onbLvlNext').disabled = false;
}

function nextLevelQuestion() {
  if (onbState.lvlIdx < LEVEL_TEST.length - 1) {
    onbState.lvlIdx++;
    renderLevelQuestion();
  } else {
    // Test bitti — seviyeyi hesapla, kaydet, sonraki adıma geç
    onbState.level = calculateLevel();
    setOnbStep(5);
  }
}

function skipLevelQuestion() {
  if (onbState.lvlLocked) return;
  // Yanlış sayalım, ilerle
  onbState.lvlLocked = true;
  nextLevelQuestion();
}

function calculateLevel() {
  const c = onbState.lvlCorrect; // 8 sorudan doğru sayısı
  if (c === 0) return 'Başlangıç';
  if (c <= 2) return 'A1';
  if (c <= 4) return 'A2';
  if (c <= 6) return 'B1';
  return 'B2';
}

// Step 5 — Günlük hedef
function bindOnbGoal() {
  const list = $('#onbGoalList');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.onb-goal');
    if (!btn) return;
    list.querySelectorAll('.onb-goal').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    onbState.goal = Number(btn.dataset.goal);
  });
}

// Step 6 — Özet ekranı doldurma
function renderOnbSummary() {
  const reasonLabels = {
    work: 'İş & kariyer', travel: 'Seyahat', exam: 'Sınav',
    culture: 'Film & dizi', hobby: 'Hobi',
  };
  const name = ($('#onbName').value || '').trim() || 'Dostum';
  const level = onbState.level || 'A1';
  $('#onbSumName').textContent = name;
  $('#onbSumLevel').textContent = level;
  $('#onbSumGoal').textContent = `${onbState.goal} soru`;
  const reasons = Array.isArray(onbState.reasons) ? onbState.reasons : [];
  $('#onbSumReason').textContent = reasons.length
    ? reasons.map(r => reasonLabels[r] || r).join(', ')
    : 'Genel';
}

// Onboarding verilerini kaydet (isim/seviye/hedef) — ekran DEĞİŞTİRMEZ.
// Hesap modal'ı önce bunu çağırır (veri anonim buluta sync olsun), ekranı değiştirmez
// ki "ana sayfa flash'ı" olmasın; ana sayfaya modal kapanınca geçilir.
function commitOnboarding() {
  const name = ($('#onbName').value || '').trim() || 'Dostum';
  store.user.name = name;
  const reasons = Array.isArray(onbState.reasons) ? onbState.reasons : [];
  store.user.reasons = reasons;                      // çoklu seçim
  store.user.reason = reasons[0] || 'hobby';         // geriye dönük uyumluluk (tek alan)
  store.user.level = onbState.level || 'A1';
  store.dailyGoal = onbState.goal;
  store.onboarded = true;
  saveStore();
  applyUserToUI();
  refreshStats();
}
function finishOnboarding() {
  commitOnboarding();
  // Firebase resmi event'i tutorial_complete — yeni kullanıcı dönüşüm hunisi için kritik
  try { if (window.Cloud && Cloud.logEvent) Cloud.logEvent('tutorial_complete'); } catch (e) {}
  showScreen('home');
}

// Tüm verileri sıfırla — local + (varsa) bulut, sonra uygulamayı yeniden başlat
async function resetAllData() {
  // Bulut bağlıysa önce defaults'u buluta yaz (yeniden çekince geri gelmesin)
  try {
    if (window.Cloud && Cloud.isReady() && Cloud.currentUser()) {
      Object.keys(store).forEach(k => delete store[k]);
      Object.assign(store, JSON.parse(JSON.stringify(defaultStore)));
      await Cloud.syncNow();
    }
  } catch (e) { /* yine de local'i temizle */ }
  // Local depoyu temizle
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  // Sıfır durumdan yeniden başlat (onboarding tekrar açılır)
  location.reload();
}

// İsmi ana ekrana ve profile yansıt
function applyUserToUI() {
  const name = store.user.name || 'Dostum';
  const greet = document.querySelector('.greeting-title .accent');
  if (greet) greet.textContent = name;
  const avatar = document.querySelector('.avatar-circle');
  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  const profName = document.querySelector('.profile-name');
  if (profName) profName.textContent = name;
}

// Onboarding eventlerini bağla
function populateOnbLevelCounts() {
  const pick = document.getElementById('onbLvlPick');
  if (!pick) return;
  pick.querySelectorAll('.onb-opt[data-level]').forEach(btn => {
    const lv = btn.dataset.level;
    const count = WORDS.filter(w => wordLevel(w) === lv).length;
    const desc = btn.querySelector('.onb-opt-desc');
    if (desc && !desc.dataset.countInjected) {
      // Kelime sayısı yazılmıyor
      desc.dataset.countInjected = '1';
    }
  });
}

function initOnboarding() {
  bindOnbName();
  bindOnbReason();
  bindOnbGoal();
  populateOnbLevelCounts();

  // Genel ileri / geri
  document.querySelectorAll('[data-onb-next]').forEach(btn => {
    btn.addEventListener('click', () => onbNext());
  });
  document.querySelectorAll('[data-onb-back]').forEach(btn => {
    btn.addEventListener('click', () => onbBack());
  });

  // Seviye seçimi — kullanıcı bir kart işaretler, sonra "Devam Et"e basar.
  // "Emin değilim" özel kartı (data-level="__test__") yerleştirme testini açar.
  $('#onbLvlPick')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.onb-opt');
    if (!btn) return;
    Feedback.tap();
    const pick = document.getElementById('onbLvlPick');
    pick.querySelectorAll('.onb-opt.selected').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    onbState.pendingLevel = btn.dataset.level;
    const cont = document.getElementById('onbLvlContinueBtn');
    if (cont) cont.disabled = false;
  });
  $('#onbLvlContinueBtn')?.addEventListener('click', () => {
    const choice = onbState.pendingLevel;
    if (!choice) return;
    Feedback.tap();
    if (choice === '__test__') {
      showOnbLvlTest();
    } else {
      onbState.level = choice;
      setOnbStep(5);
    }
  });
  // Testten seviye seçimine dön
  $('#onbLvlTestBack')?.addEventListener('click', () => { Feedback.tap(); showOnbLvlChoice(); });

  // Seviye testi navigasyon
  $('#onbLvlNext')?.addEventListener('click', () => nextLevelQuestion());
  $('#onbLvlSkip')?.addEventListener('click', () => skipLevelQuestion());

  // Bitir → özet ekranına
  $('#onbFinish')?.addEventListener('click', () => {
    renderOnbSummary();
    setOnbStep(6);
  });

  // Özet ekranı — hesap seçimi (Duolingo tarzı)
  // Önce onboarding'i bitir (isim/seviye/hedef kaydedilir, anonim buluta sync olur),
  // sonra hesap oluştur/giriş modal'ı açılır. Anonim→email link ile veri korunur.
  $('#onbCreateAccount')?.addEventListener('click', () => {
    Feedback.tap();
    commitOnboarding();        // veriyi kaydet ama ekranı DEĞİŞTİRME (flash yok)
    openAuthModal('signup', true);   // onboarding'den açıldı → kapanınca home'a geçer
  });
  $('#onbSignIn')?.addEventListener('click', () => {
    Feedback.tap();
    commitOnboarding();
    openAuthModal('signin', true);
  });
  // Misafir devam et
  $('#onbEnterApp')?.addEventListener('click', () => finishOnboarding());
}

// =====================================================================
// ADS — AdMob entegrasyonu (banner + interstitial + rewarded)
// Test ad unit ID'leri Google'ın resmi test ID'leri. Yayın için
// AdMob Console'da gerçek unit ID'lerini al ve aşağıya yaz.
// Premium kullanıcılarda hiçbir reklam gösterilmez.
// =====================================================================
// AdMob unit ID'leri platform-bazlı. iOS ve Android ayrı AdMob app'lerine ait —
// AdMob policy gereği cross-platform unit kullanımı reddedilir.
const ADMOB_IDS = {
  test: {
    banner:       'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded:     'ca-app-pub-3940256099942544/5224354917',
  },
  android: {
    banner:       'ca-app-pub-4146784294472727/7969688612',
    interstitial: 'ca-app-pub-4146784294472727/1428330994',
    rewarded:     'ca-app-pub-4146784294472727/9352191112',
  },
  ios: {
    banner:       'ca-app-pub-4146784294472727/2340628429',
    interstitial: 'ca-app-pub-4146784294472727/1315616516',
    rewarded:     'ca-app-pub-4146784294472727/5550374990',
  },
};

const Ads = (() => {
  let _initialized = false;
  let _useTestAds = false; // production'da false yap
  // TEST MODU: reklamlar tamamen kapalı (banner/interstitial/rewarded gösterilmez).
  // YAYIN ÖNCESİ: bunu true + _useTestAds = false yap.
  const _ADS_ENABLED = true;
  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  }
  async function init() {
    if (!_ADS_ENABLED) return false;   // test modu — AdMob hiç başlatılmaz
    if (_initialized) return true;
    const P = plugin();
    if (!P) return false;
    try {
      // iOS ATT — initialize flag'i Capacitor AdMob v6.2 + iOS 26.5'te
      // popup'ı tetiklemiyor, manuel çağrı şart (Apple review reject 10 Haz 2026)
      const platform = window.Capacitor?.getPlatform?.();
      if (platform === 'ios') {
        try {
          const res = await P.trackingAuthorizationStatus();
          if (res && res.status === 'notDetermined') {
            await P.requestTrackingAuthorization();
          }
        } catch (attErr) {
          console.warn('[Kelimoli] ATT request failed:', attErr);
        }
      }
      await P.initialize({
        testingDevices: [],
        initializeForTesting: _useTestAds,
      });
      _initialized = true;
      return true;
    } catch (e) {
      console.warn('[Kelimoli] AdMob init başarısız:', e);
      return false;
    }
  }
  function adUnit(type) {
    if (_useTestAds) return ADMOB_IDS.test[type];
    const platform = window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android';
    return ADMOB_IDS[platform][type];
  }
  // Reklam gösterilsin mi? Test modunda kapalı; premium kullanıcıda hiç gösterilmez.
  function shouldShow() {
    return _ADS_ENABLED && !Premium.isPremium() && _initialized;
  }

  // Banner — alt navigasyonun üstünde küçük banner
  let _bannerVisible = false;
  function _toggleAdLabel(visible) {
    const el = document.getElementById('adLabel');
    if (el) el.hidden = !visible;
  }
  async function showBanner() {
    if (!shouldShow()) return;
    if (_bannerVisible) return;       // zaten görünüyor — tekrar çağırma (titreme önlenir)
    const P = plugin(); if (!P) return;
    try {
      await P.showBanner({
        adId: adUnit('banner'),
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 56,           // bottom nav yüksekliğinin üstünde
        isTesting: _useTestAds,
      });
      _bannerVisible = true;
      _toggleAdLabel(true);
      try { if (window.Cloud && Cloud.logEvent) Cloud.logEvent('ad_impression', { ad_format: 'banner', ad_platform: 'admob' }); } catch (e) {}
    } catch (e) {}
  }
  async function hideBanner() {
    _toggleAdLabel(false);
    if (!_bannerVisible) return;
    const P = plugin(); if (!P) return;
    try { await P.hideBanner(); _bannerVisible = false; } catch (e) { _bannerVisible = false; }
  }
  // Banner sadece quiz/sınav/oyun ekranlarında — ana sayfa, profil, kelime listesi
  // gibi gezinme ekranlarında uygulama "premium" görünsün diye gizli.
  const BANNER_SCREENS = new Set(['quiz', 'exam', 'verbs', 'order', 'match', 'mistakes']);
  function syncBanner(screenName, navVisible) {
    if (Premium.isPremium()) { hideBanner(); return; }
    if (navVisible && BANNER_SCREENS.has(screenName)) showBanner();
    else hideBanner();
  }

  // Interstitial — quiz/movie sonu (her 3. tamamlamada 1 kez göster — agresif değil)
  let _interstitialReady = false;
  async function prepareInterstitial() {
    if (!shouldShow()) return;
    const P = plugin(); if (!P) return;
    try {
      await P.prepareInterstitial({
        adId: adUnit('interstitial'),
        isTesting: _useTestAds,
      });
      _interstitialReady = true;
    } catch (e) {}
  }
  async function maybeShowInterstitial() {
    if (!shouldShow()) return false;
    if (!store.adCounters) store.adCounters = { quizFinished: 0 };
    store.adCounters.quizFinished = (store.adCounters.quizFinished || 0) + 1;
    saveStore();
    // Her 3 quiz/film/oyun tamamlamasında 1 reklam göster
    if (store.adCounters.quizFinished % 3 !== 0) return false;
    if (!_interstitialReady) {
      await prepareInterstitial();
      if (!_interstitialReady) return false;
    }
    const P = plugin(); if (!P) return false;
    try {
      await P.showInterstitial();
      _interstitialReady = false;
      try { if (window.Cloud && Cloud.logEvent) Cloud.logEvent('ad_impression', { ad_format: 'interstitial', ad_platform: 'admob' }); } catch (e) {}
      prepareInterstitial(); // sonraki için hazırla
      return true;
    } catch (e) { return false; }
  }

  // Rewarded video — "5 ekstra kalp" veya "2x XP" vermek için
  let _rewardedReady = false;
  async function prepareRewarded() {
    if (!shouldShow()) return;
    const P = plugin(); if (!P) return;
    try {
      await P.prepareRewardVideoAd({
        adId: adUnit('rewarded'),
        isTesting: _useTestAds,
      });
      _rewardedReady = true;
    } catch (e) {}
  }
  async function showRewarded() {
    if (!shouldShow()) return { rewarded: false };
    if (!_rewardedReady) {
      await prepareRewarded();
      if (!_rewardedReady) return { rewarded: false };
    }
    const P = plugin(); if (!P) return { rewarded: false };
    try {
      const result = await P.showRewardVideoAd();
      _rewardedReady = false;
      try { if (window.Cloud && Cloud.logEvent) Cloud.logEvent('ad_impression', { ad_format: 'rewarded', ad_platform: 'admob' }); } catch (e) {}
      prepareRewarded();
      // result.type === 'reward' anlamına gelir; basit kabul edelim
      return { rewarded: true, amount: result?.amount || 1 };
    } catch (e) { return { rewarded: false }; }
  }

  return { init, showBanner, hideBanner, syncBanner, prepareInterstitial, maybeShowInterstitial, prepareRewarded, showRewarded };
})();

// =====================================================================
// PREMIUM — RevenueCat (Google Play Billing) ile gerçek satın alma.
// isPremium() entitlement durumunu okur (RevenueCat'in cache'i + local yedek).
// Anahtar/native yoksa local-only çalışır (satın alma pasif, çökme yok).
// RevenueCat appUserID = Firebase uid (cihazlar arası premium taşınır).
// =====================================================================
const PREMIUM_PRODUCTS = [
  {
    id: 'kelimoli_premium_monthly',
    title: 'Aylık Premium',
    price: '150₺',
    period: 'ay',
    badge: '',
  },
  {
    id: 'kelimoli_premium_yearly',
    title: 'Yıllık Premium',
    price: '500₺',
    period: 'yıl',
    badge: 'En çok tercih edilen · %72 indirim',
  },
  {
    id: 'kelimoli_premium_lifetime',
    title: 'Ömür Boyu',
    price: '1000₺',
    period: 'tek seferlik',
    badge: 'En iyi değer',
  },
];

// PREMIUM FEATURE FLAG — false iken premium ile ilgili tüm UI gizlenir:
// banner kart, Sinema Sahnesi paywall yönlendirmesi, kalp modalındaki "Premium" butonu.
// Türkiye'de bireysel ödeme profili izni yok, premium yayını şirket kurulumu sonrasına
// ertelendi. Şirket kurulup RevenueCat API key girilince bu flag true yapılıp yeni AAB derlenir.
const PREMIUM_FEATURE_AVAILABLE = false;

const Premium = (() => {
  const cfg = window.REVENUECAT_CONFIG || {};
  const ENTITLEMENT = cfg.entitlementId || 'premium';
  let _ready = false;       // RevenueCat configure edildi mi
  let _active = false;      // entitlement aktif mi (senkron okunabilir cache)
  let _offerings = null;    // getOfferings cache

  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases;
  }
  function isNative() {
    const cap = window.Capacitor;
    if (!cap) return false;
    return typeof cap.isNativePlatform === 'function' ? cap.isNativePlatform() : !!cap.isNative;
  }

  // Local yedek — RevenueCat henüz hazır değilken (cold start / offline) son bilinen durum
  function localPremium() {
    if (!store.premium) return false;
    if (store.premium.lifetime) return true;
    if (store.premium.expiresAt && store.premium.expiresAt > Date.now()) return true;
    return false;
  }

  // RevenueCat hazırsa onun durumu kesin doğrudur; değilse local cache.
  function isPremium() {
    return _ready ? _active : localPremium();
  }

  // CustomerInfo → entitlement durumu + local cache senkronu + UI tazele
  function _applyCustomerInfo(info) {
    try {
      const active = info && info.entitlements && info.entitlements.active
        ? info.entitlements.active[ENTITLEMENT] : null;
      _active = !!active;
      if (_active) {
        store.premium = store.premium || {};
        store.premium.productId = active.productIdentifier || store.premium.productId || null;
        if (active.expirationDate) {
          store.premium.expiresAt = new Date(active.expirationDate).getTime();
          store.premium.lifetime = false;
        } else {
          // expirationDate yok → kalıcı (non-consumable / lifetime)
          store.premium.lifetime = true;
        }
        store.premium.willRenew = !!active.willRenew;
      } else {
        store.premium = null;
      }
      saveStore();
      try { renderHearts(); } catch (e) {}
      try { refreshPremiumBanner(); } catch (e) {}
      // Premium aktifse banner reklamı hemen gizle
      try { if (_active && typeof Ads !== 'undefined') Ads.hideBanner(); } catch (e) {}
    } catch (e) {}
  }

  // Uygulama açılışında bir kez — RevenueCat'i yapılandır, mevcut durumu çek
  async function init() {
    const P = plugin();
    if (!P || !isNative()) return false;            // web/desktop → local-only
    if (!cfg.androidApiKey) {
      console.info('[Kelimoli] RevenueCat API key yok — premium pasif (local-only).');
      return false;
    }
    try {
      await P.configure({ apiKey: cfg.androidApiKey });
      _ready = true;
      const res = await P.getCustomerInfo();
      _applyCustomerInfo(res && res.customerInfo);
      return true;
    } catch (e) {
      console.warn('[Kelimoli] RevenueCat init başarısız:', e);
      return false;
    }
  }

  // Firebase kullanıcısına bağla — premium hesaba ait olur, cihazlar arası taşınır.
  // Anonim→email yükseltmede uid sabit kalır; farklı hesaba geçişte entitlement yeni hesaba göre güncellenir.
  async function linkUser(uid) {
    const P = plugin();
    if (!_ready || !P || !uid) return;
    try {
      const res = await P.logIn({ appUserID: uid });
      _applyCustomerInfo(res && res.customerInfo);
    } catch (e) { /* sessiz — bir sonraki getCustomerInfo'da düzelir */ }
  }

  async function _getOfferings() {
    const P = plugin();
    if (!_ready || !P) return null;
    if (_offerings) return _offerings;
    try {
      _offerings = await P.getOfferings();   // { current, all }
      return _offerings;
    } catch (e) { return null; }
  }

  // productId'ye karşılık gelen RevenueCat paketini bul (önce current offering)
  async function _findPackage(productId) {
    const offs = await _getOfferings();
    if (!offs) return null;
    const offerings = [];
    if (offs.current) offerings.push(offs.current);
    if (offs.all) Object.values(offs.all).forEach(o => { if (o !== offs.current) offerings.push(o); });
    for (const off of offerings) {
      const pkg = (off.availablePackages || []).find(p => p.product && p.product.identifier === productId);
      if (pkg) return pkg;
    }
    return null;
  }

  async function purchase(productId) {
    const P = plugin();
    if (!_ready || !P) {
      return { ok: false, reason: 'unavailable', message: 'Satın alma şu an kullanılamıyor. İnternet bağlantını kontrol edip tekrar dene.' };
    }
    const pkg = await _findPackage(productId);
    if (!pkg) {
      return { ok: false, reason: 'no_product', message: 'Ürün bulunamadı. Mağaza ürünleri henüz hazır olmayabilir, biraz sonra tekrar dene.' };
    }
    try {
      const res = await P.purchasePackage({ aPackage: pkg });
      _applyCustomerInfo(res && res.customerInfo);
      if (isPremium()) {
        Feedback.levelUp();
        showAchievementPopup({ icon: '👑', name: 'Premium aktif!', desc: 'Tüm özellikler kilidi açıldı' });
        return { ok: true };
      }
      return { ok: false, reason: 'not_granted', message: 'Ödeme alındı ama premium etkinleşmedi. "Satın alımları geri yükle" ile dene.' };
    } catch (e) {
      // Kullanıcı iptali → sessiz geç (hata gösterme)
      if (e && (e.userCancelled || e.code === 'PurchaseCancelledError' || e.code === '1' || /cancel/i.test(e.message || ''))) {
        return { ok: false, reason: 'cancelled' };
      }
      return { ok: false, reason: 'error', message: 'Satın alma tamamlanamadı: ' + (e && e.message ? e.message : 'bilinmeyen hata') };
    }
  }

  async function restore() {
    const P = plugin();
    if (!_ready || !P) return { ok: false, reason: 'unavailable' };
    try {
      const res = await P.restorePurchases();
      _applyCustomerInfo(res && res.customerInfo);
      return { ok: isPremium() };
    } catch (e) {
      return { ok: false, reason: 'error' };
    }
  }

  return { init, linkUser, isPremium, purchase, restore, getOfferings: _getOfferings };
})();

// =====================================================================
// LOCAL NOTIFICATIONS — Günlük hatırlatma + seri uyarısı
// Capacitor Local Notifications plugin'i kullanılır. Web'de no-op.
// Her gün belirli saatte: "Serini koru!" + bugün eksik kalan görev sayısı.
// =====================================================================
const Notif = (() => {
  function plugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  }
  async function ensurePermission() {
    const P = plugin();
    if (!P) return false;
    try {
      const cur = await P.checkPermissions();
      if (cur.display === 'granted') return true;
      const req = await P.requestPermissions();
      return req.display === 'granted';
    } catch (e) { return false; }
  }
  async function cancelAll() {
    const P = plugin(); if (!P) return;
    try {
      const pending = await P.getPending();
      if (pending.notifications && pending.notifications.length) {
        await P.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
      }
    } catch (e) {}
  }
  // Her gün belirli saatte tekrar eden hatırlatma — sonraki 7 gün için planlanır
  async function scheduleDailyReminder(hour, minute) {
    const P = plugin(); if (!P) return;
    const granted = await ensurePermission();
    if (!granted) return false;
    await cancelAll();
    const notifs = [];
    const titles = [
      'Serini koru! 🔥',
      'Kelime zamanı 📚',
      'Bugün 5 dakika? ⏱️',
      'Kelimoli seni bekliyor 👋',
      'Tekrar vakti 🧠',
      'Hadi bir tur daha 💪',
      'Hafıza azalmadan 💡',
    ];
    const bodies = [
      'Günlük hedefini tamamla, serini kaybetme.',
      'Bugün öğrendiklerini tekrar et — kalıcı olsun.',
      'Sadece 5 soru bile seriyi sürdürür.',
      'Yeni kelimeler seni bekliyor.',
      'Tekrar etmediklerin unutuluyor olabilir.',
      'Bir film sahnesiyle eğlenceli pratik?',
      'Bugün kelime ekle, yarın kendine teşekkür et.',
    ];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const at = new Date(now);
      at.setDate(at.getDate() + i);
      at.setHours(hour, minute, 0, 0);
      if (at.getTime() <= Date.now()) continue;
      notifs.push({
        id: 1000 + i,
        title: titles[i % titles.length],
        body:  bodies[i % bodies.length],
        schedule: { at: at },
        smallIcon: 'ic_stat_kelimoli',
      });
    }
    try {
      await P.schedule({ notifications: notifs });
      return true;
    } catch (e) { return false; }
  }
  return { ensurePermission, scheduleDailyReminder, cancelAll };
})();

// =====================================================================
// TEMA — Karanlık / Aydınlık mod yönetimi
// 'auto' modunda sistem tercihini takip eder; 'light'/'dark' manuel.
// =====================================================================
function applyTheme() {
  const pref = store.prefs.theme || 'auto';
  let effective;
  if (pref === 'auto') {
    effective = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  } else {
    effective = pref;
  }
  document.documentElement.setAttribute('data-theme', effective);
  // Status bar rengi de güncellensin (Android tarayıcı/Capacitor)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', effective === 'dark' ? '#0E0F13' : '#F6F4EE');
}

// Sistem teması değişirse 'auto' modunda otomatik adapte ol
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if ((store.prefs.theme || 'auto') === 'auto') applyTheme();
    });
}

// =====================================================================
// AYARLAR — Profil ekranındaki toggle'ları store.prefs'e bağla
// =====================================================================
function bindPrefToggles() {
  const theme = $('#prefTheme');
  const haptic = $('#prefHaptic');
  const sound = $('#prefSound');

  if (theme) {
    // Toggle'ın checked durumu: efektif tema dark mı?
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    theme.checked = isDark;
    theme.addEventListener('change', () => {
      store.prefs.theme = theme.checked ? 'dark' : 'light';
      saveStore();
      applyTheme();
      Feedback.tap();
    });
  }
  if (haptic) {
    haptic.checked = store.prefs.haptic !== false;
    haptic.addEventListener('change', () => {
      store.prefs.haptic = haptic.checked;
      saveStore();
      if (haptic.checked) Feedback.tap(); // kullanıcı açtığında örnek titreşim
    });
  }
  if (sound) {
    sound.checked = store.prefs.sound !== false;
    sound.addEventListener('change', () => {
      store.prefs.sound = sound.checked;
      saveStore();
      if (sound.checked) Feedback.correct(); // kullanıcı açtığında örnek ses
    });
  }

  // Bildirim toggle + saat seçici
  const notif = $('#prefNotif');
  const notifTimeRow = $('#prefNotifTimeRow');
  const notifTime = $('#prefNotifTime');
  function syncNotifUI() {
    if (notifTimeRow) notifTimeRow.style.display = store.prefs.notif ? 'flex' : 'none';
    if (notifTime) {
      const h = String(store.prefs.notifHour ?? 19).padStart(2, '0');
      const m = String(store.prefs.notifMinute ?? 0).padStart(2, '0');
      notifTime.value = `${h}:${m}`;
    }
  }
  if (notif) {
    notif.checked = !!store.prefs.notif;
    syncNotifUI();
    notif.addEventListener('change', async () => {
      Feedback.tap();
      if (notif.checked) {
        const ok = await Notif.scheduleDailyReminder(
          store.prefs.notifHour ?? 19,
          store.prefs.notifMinute ?? 0
        );
        if (!ok) {
          notif.checked = false;
          alert('Bildirim izni verilmedi. Telefon ayarlarından Kelimoli için bildirimleri aç.');
          return;
        }
        store.prefs.notif = true;
      } else {
        await Notif.cancelAll();
        store.prefs.notif = false;
      }
      saveStore();
      syncNotifUI();
    });
  }
  if (notifTime) {
    notifTime.addEventListener('change', async () => {
      const [h, m] = notifTime.value.split(':').map(n => parseInt(n, 10));
      store.prefs.notifHour = isNaN(h) ? 19 : h;
      store.prefs.notifMinute = isNaN(m) ? 0 : m;
      saveStore();
      if (store.prefs.notif) {
        await Notif.scheduleDailyReminder(store.prefs.notifHour, store.prefs.notifMinute);
      }
    });
  }
}

// Tekrar bekleyenler banner'ı → SM-2 önceliklendirmeli quiz
$('#dueBanner')?.addEventListener('click', () => {
  Feedback.tap();
  startQuiz();
});

// Leaderboard banner + kapatma
$('#leaderboardBanner')?.addEventListener('click', () => {
  Feedback.tap();
  openLeaderboard();
});
$('#lbClose')?.addEventListener('click', () => showScreen('profile'));

// Premium banner + paywall
$('#premiumBanner')?.addEventListener('click', () => {
  Feedback.tap();
  openPaywall();
});
$('#paywallClose')?.addEventListener('click', () => showScreen('profile'));
$('#paywallBuy')?.addEventListener('click', onPaywallBuy);
$('#paywallRestore')?.addEventListener('click', onPaywallRestore);

// Profil — İsim düzenle + İngilizce seviye seç
$('#editNameBtn')?.addEventListener('click', () => {
  Feedback.tap();
  showPrompt({
    title: 'İsmini Düzenle',
    value: (store.user && store.user.name) || '',
    placeholder: 'Adın',
    maxLength: 24,
    validate: checkName,   // küfür/siyasi/dini isim reddedilir (ligde görünür)
    onSave: (name) => {
      if (!name) return;
      if (!store.user) store.user = {};
      store.user.name = name.trim();
      saveStore();
      applyUserToUI();
      try { if (window.Cloud && Cloud.isReady()) Cloud.scheduleLeaderboardUpdate(); } catch (e) {}
    },
  });
});
document.querySelectorAll('#levelSelect .lvl-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    Feedback.tap();
    confirmLevelChange(btn.dataset.level);  // doğrudan değiştirme — önce geçiş ekranı
  });
});

// Gizlilik Politikası linkleri — Capacitor Browser plugin varsa native, yoksa fallback
const PRIVACY_URL_TR = 'https://mucahitcelebi0.github.io/kelimoli-privacy/';
const PRIVACY_URL_EN = 'https://mucahitcelebi0.github.io/kelimoli-privacy/en.html';
function openExternal(url) {
  const Browser = window.Capacitor?.Plugins?.Browser;
  if (Browser?.open) {
    Browser.open({ url }).catch(() => window.open(url, '_blank'));
  } else {
    window.open(url, '_blank');
  }
}
$('#openPrivacyTr')?.addEventListener('click', () => { Feedback.tap(); openExternal(PRIVACY_URL_TR); });
$('#openPrivacyEn')?.addEventListener('click', () => { Feedback.tap(); openExternal(PRIVACY_URL_EN); });

// Verileri Sıfırla — çift onay (geri alınamaz)
$('#resetDataBtn')?.addEventListener('click', () => {
  Feedback.tap();
  showConfirm({
    title: 'Verileri sıfırla?',
    message: 'XP, seri, rozetler, kelime ilerlemen ve tüm ayarların kalıcı olarak silinecek. Bu işlem GERİ ALINAMAZ.',
    confirmText: 'Devam',
    cancelText: 'Vazgeç',
    danger: true,
    onConfirm: () => {
      // İkinci onay — yanlışlıkla silmeyi önler
      showConfirm({
        title: 'Emin misin?',
        message: 'Son uyarı: tüm ilerlemen silinecek ve uygulama sıfırdan başlayacak.',
        confirmText: 'Evet, Sıfırla',
        cancelText: 'Vazgeç',
        danger: true,
        onConfirm: () => resetAllData(),
      });
    },
  });
});

// ---------- BAŞLANGIÇ ----------
applyTheme();          // tema en başta — beyaz flash olmasın
injectIcons();         // metin sembollerini SVG ikonlara çevir
initOnboarding();
setTodayDate();
setWordOfDay();
rollDailyCounters();
rollDailyQuests();     // bugünün 3 görevini hazırla
applyUserToUI();
refreshStats();
renderQuests();        // ana sayfada görev kartlarını çiz
bindPrefToggles();
bindAuthHandlers();    // hesap modal'ı event'leri
// NOT: Premium DEV arka kapısı (taca 5 dokunma) kaldırıldı — production'da
// herkesin bedava premium açmasına yol açıyordu. Premium artık yalnızca
// RevenueCat (Play Billing) üzerinden gerçek satın almayla etkinleşir.
// Geçmiş aktivitelerden hak edilmiş rozetler — SADECE BİR KEZ sessiz açma.
// (Her açılışta çalışsaydı yeni rozetler popup yerine sessizce açılırdı.)
(function migrateAchievementsOnce() {
  if (!store.achievements) store.achievements = { unlocked: [], seen: [] };
  if (store.achievements.migrated) return;   // bir kez yapıldı, bir daha dokunma
  for (const a of ACHIEVEMENTS) {
    if (!store.achievements.unlocked.includes(a.id) && achDone(a)) {
      store.achievements.unlocked.push(a.id);
    }
  }
  store.achievements.migrated = true;
  saveStore();
})();

// Bildirim açıksa, her açılışta sonraki 7 günü yeniden zamanla
if (store.prefs?.notif) {
  Notif.scheduleDailyReminder(store.prefs.notifHour ?? 19, store.prefs.notifMinute ?? 0);
}

// =====================================================================
// PAYWALL — Premium satın alma ekranı
// =====================================================================
let _selectedPlanId = 'kelimoli_premium_yearly';
// productId → mağazadan gelen lokalize fiyat (ör. "₺149,99"). RevenueCat'ten doldurulur.
let _priceMap = null;

// Gerçek mağaza fiyatlarını RevenueCat offering'lerinden çek (Google gerçek fiyat ister)
async function _loadRealPrices() {
  try {
    const offs = await Premium.getOfferings();
    if (!offs) return;
    const map = {};
    const offerings = [];
    if (offs.current) offerings.push(offs.current);
    if (offs.all) Object.values(offs.all).forEach(o => offerings.push(o));
    offerings.forEach(off => (off.availablePackages || []).forEach(pkg => {
      if (pkg.product && pkg.product.identifier) {
        map[pkg.product.identifier] = pkg.product.priceString;
      }
    }));
    _priceMap = map;
  } catch (e) {}
}

function openPaywall() {
  renderPaywallPlans();              // anında render (yedek fiyatlarla)
  showScreen('paywall');
  if (window.Cloud) Cloud.logEvent('paywall_view');
  // Gerçek mağaza fiyatları gelince yeniden çiz
  _loadRealPrices().then(() => renderPaywallPlans());
}
function renderPaywallPlans() {
  const wrap = $('#paywallPlans');
  if (!wrap) return;
  wrap.innerHTML = PREMIUM_PRODUCTS.map(p => {
    const price = (_priceMap && _priceMap[p.id]) || p.price;   // gerçek varsa onu kullan
    return `
    <button class="plan-card ${p.id === _selectedPlanId ? 'selected' : ''}" data-id="${p.id}">
      ${p.badge ? `<span class="plan-badge">${p.badge}</span>` : ''}
      <div class="plan-title">${p.title}</div>
      <div class="plan-price"><span>${price}</span> <small>/ ${p.period}</small></div>
    </button>`;
  }).join('');
  wrap.querySelectorAll('.plan-card').forEach(btn => {
    btn.addEventListener('click', () => {
      _selectedPlanId = btn.dataset.id;
      renderPaywallPlans();
      Feedback.tap();
    });
  });
}
async function onPaywallBuy() {
  Feedback.tap();
  const btn = $('#paywallBuy');
  btn.disabled = true;
  btn.textContent = 'İşleniyor…';
  if (window.Cloud) Cloud.logEvent('paywall_buy_click', { product_id: _selectedPlanId });
  const result = await Premium.purchase(_selectedPlanId);
  btn.disabled = false;
  btn.textContent = 'Devam Et';
  if (result.ok) {
    // Firebase resmi e-commerce event'i — conversion funnel için kritik
    try { if (window.Cloud && Cloud.logEvent) Cloud.logEvent('purchase', { item_id: _selectedPlanId, currency: result.currency || 'TRY', value: result.price || 0 }); } catch (e) {}
    refreshPremiumBanner();
    try { Ads.hideBanner(); } catch (e) {}
    showAchievementPopup({ icon: '👑', name: 'Teşekkürler!', desc: 'Premium aktif — reklamsız + tüm özellikler' });
    showScreen('profile');
  } else if (result.reason === 'cancelled') {
    // Kullanıcı kendi iptal etti — sessiz geç, uyarı gösterme
  } else {
    alert(result.message || 'Satın alma şu anda kullanılamıyor.');
  }
}
async function onPaywallRestore() {
  Feedback.tap();
  const result = await Premium.restore();
  alert(result.ok ? 'Satın alımların geri yüklendi.' : 'Geri yüklenecek satın alım bulunamadı.');
}

function refreshPremiumBanner() {
  const banner = $('#premiumBanner');
  if (!banner) return;
  // Premium feature kapalıyken banner'ı gizle — kullanıcı paywall'a yönlenmesin.
  if (!PREMIUM_FEATURE_AVAILABLE) { banner.style.display = 'none'; return; }
  banner.style.display = '';
  const title = $('#premiumBannerTitle');
  const sub = $('#premiumBannerSub');
  const icon = $('#premiumBannerIcon');
  if (Premium.isPremium()) {
    banner.classList.add('active');
    if (icon) icon.innerHTML = iconSvg('check');
    title.textContent = 'Premium aktif';
    if (store.premium?.lifetime) {
      sub.textContent = 'Ömür boyu erişim · Teşekkürler!';
    } else if (store.premium?.expiresAt) {
      const days = Math.max(0, Math.ceil((store.premium.expiresAt - Date.now()) / 86400000));
      sub.textContent = `${days} gün kaldı`;
    } else {
      sub.textContent = 'Aktif';
    }
  } else {
    banner.classList.remove('active');
    if (icon) icon.innerHTML = iconSvg('crown');
    title.textContent = 'Kelimoli Premium';
    sub.textContent = 'Reklamsız · sınırsız kalp · bonuslar';
  }
}

// =====================================================================
// LEADERBOARD — Haftalık XP yarışı ekranı
// Lig kademeleri (haftalık XP eşiği):
//   - Bronz (0-499) 🥉
//   - Gümüş (500-1499) 🥈
//   - Altın (1500-3999) 🥇
//   - Elmas (4000+) 💎
// =====================================================================
function getLeague(weeklyXp) {
  const xp = weeklyXp || 0;
  if (xp >= 4000) return { name: 'Elmas Lig',  badge: '💎', tier: 'diamond' };
  if (xp >= 1500) return { name: 'Altın Lig',  badge: '🥇', tier: 'gold'    };
  if (xp >=  500) return { name: 'Gümüş Lig',  badge: '🥈', tier: 'silver'  };
  return            { name: 'Bronz Lig',  badge: '🥉', tier: 'bronze'  };
}

// Bu haftanın bitiş zamanı (pazar gece yarısı) — geri sayım için
function weekEndsAt() {
  const now = new Date();
  const day = now.getDay() || 7; // pazartesi=1, pazar=7
  const sundayMidnight = new Date(now);
  sundayMidnight.setDate(now.getDate() + (7 - day));
  sundayMidnight.setHours(23, 59, 59, 999);
  return sundayMidnight;
}

function formatTimeUntil(target) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return 'bu hafta sona erdi';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days >= 1) return `${days} gün ${hours} saat sonra biter`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours} saat ${minutes} dakika sonra biter`;
}

async function openLeaderboard() {
  rollWeeklyCounter();
  const weekly = store.weeklyXp || 0;
  const league = getLeague(weekly);

  // Hero
  $('#lbLeague').textContent = league.badge;
  $('#lbLeagueName').textContent = league.name;
  $('#lbMyXp').textContent = weekly;
  $('#lbWeekEnd').textContent = formatTimeUntil(weekEndsAt());
  $('#lbHero').dataset.tier = league.tier;

  // Loading placeholder
  const list = $('#lbList');
  list.innerHTML = '<div class="lb-loading">Yükleniyor…</div>';
  $('#lbEmpty').style.display = 'none';
  showScreen('leaderboard');

  if (!window.Cloud || !Cloud.isReady()) {
    list.innerHTML = '';
    $('#lbEmpty').style.display = 'block';
    $('#lbEmpty').querySelector('.lb-empty-text').textContent =
      'Liderlik tablosu için hesap gerekiyor. Profil ekranından hesap oluştur.';
    return;
  }

  const entries = await Cloud.fetchLeaderboard(30);
  if (!entries || entries.length === 0) {
    list.innerHTML = '';
    $('#lbEmpty').style.display = 'block';
    return;
  }

  const myUid = Cloud.currentUser()?.uid;
  list.innerHTML = entries.map((e, i) => {
    const rank = i + 1;
    const isMe = e.uid === myUid;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `<span class="lb-rank-num">${rank}</span>`;
    const safeName = String(e.name || 'Anonim').slice(0, 20).replace(/[<>]/g, '');
    return `
      <div class="lb-row ${isMe ? 'me' : ''} ${rank <= 3 ? 'top' : ''}">
        <div class="lb-rank">${medal}</div>
        <div class="lb-name">
          ${safeName}
          ${isMe ? '<span class="lb-you">SEN</span>' : ''}
        </div>
        <div class="lb-xp">${e.weeklyXp || 0} XP</div>
      </div>
    `;
  }).join('');
}

function refreshLeaderboardBanner() {
  const banner = $('#leaderboardBanner');
  if (!banner) return;
  if (!window.Cloud || !Cloud.isReady()) {
    banner.style.display = 'none';
    return;
  }
  rollWeeklyCounter();
  const weekly = store.weeklyXp || 0;
  const league = getLeague(weekly);
  banner.style.display = 'flex';
  banner.querySelector('.lb-icon').textContent = league.badge;
  $('#lbBannerSub').textContent = `${league.name} · ${weekly} XP`;
}

// =====================================================================
// HESAP UI — Firebase auth durumuna göre profil ekranındaki hesap kartı
// =====================================================================
function refreshAccountUI() {
  const sec = $('#accountSection');
  if (!sec) return;
  sec.style.display = 'block';
  const status = $('#accountStatus');
  const sub = $('#accountSub');
  const actions = $('#accountActions');
  const icon = $('#accountIcon');
  // Cloud henüz hazır değilse misafir görünümünü göster — kullanıcı yine de Hesap
  // Oluştur/Giriş Yap'a tıklayabilsin. Modal kendisi Cloud.init retry yapacak.
  if (!window.Cloud || !Cloud.isReady()) {
    icon.innerHTML = iconSvg('cloud');
    status.textContent = 'Misafir';
    sub.textContent = 'İlerlemen bu cihazda tutuluyor. Hesap aç, hiç kaybetme.';
    actions.innerHTML = `
      <button class="btn btn-gold" id="acctUpgrade">Hesap Oluştur</button>
      <button class="btn btn-ghost" id="acctSignIn">Giriş Yap</button>
    `;
    $('#acctUpgrade').addEventListener('click', () => openAuthModal('signup'));
    $('#acctSignIn').addEventListener('click', () => openAuthModal('signin'));
    return;
  }
  const user = Cloud.currentUser();
  if (!user) {
    status.textContent = 'Bağlanıyor…';
    sub.textContent = 'Lütfen bekle';
    actions.innerHTML = '';
    icon.innerHTML = iconSvg('dots');
    return;
  }
  if (user.isAnonymous) {
    icon.innerHTML = iconSvg('cloud');
    status.textContent = 'Misafir';
    sub.textContent = 'İlerlemen bu cihazda tutuluyor. Hesap aç, hiç kaybetme.';
    actions.innerHTML = `
      <button class="btn btn-gold" id="acctUpgrade">Hesap Oluştur</button>
      <button class="btn btn-ghost" id="acctSignIn">Giriş Yap</button>
    `;
    $('#acctUpgrade').addEventListener('click', () => openAuthModal('signup'));
    $('#acctSignIn').addEventListener('click', () => openAuthModal('signin'));
  } else {
    icon.innerHTML = iconSvg('shield');
    status.textContent = user.email || 'Hesap aktif';
    sub.textContent = 'İlerlemen otomatik kaydediliyor ve tüm cihazlarla senkron.';
    actions.innerHTML = `
      <button class="btn btn-ghost" id="acctSignOut"><span class="ctrl-ico" data-icon="logout"></span>Çıkış Yap</button>
    `;
    const soBtn = $('#acctSignOut');
    if (soBtn) { soBtn.querySelector('.ctrl-ico').innerHTML = iconSvg('logout'); }
    soBtn?.addEventListener('click', () => {
      Feedback.tap();
      showConfirm({
        title: 'Çıkış yap?',
        message: 'İlerlemen hesabında güvende kalır. İstediğin zaman tekrar giriş yapabilirsin.',
        confirmText: 'Çıkış Yap',
        cancelText: 'Vazgeç',
        danger: true,
        onConfirm: async () => { await Cloud.signOut(); refreshAccountUI(); },
      });
    });
  }
}

// Firebase (Cloud) hazır olana kadar bekle — CDN'den geç yüklenebilir.
function waitForCloudReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    const start = Date.now();
    (function check() {
      if (window.Cloud && Cloud.isReady && Cloud.isReady()) return resolve(true);
      if (Date.now() - start > timeoutMs) return resolve(false);
      setTimeout(check, 150);
    })();
  });
}

let _authFromOnboarding = false;
function openAuthModal(mode = 'signup', fromOnboarding = false) {
  const modal = $('#authModal');
  if (!modal) return;
  _authFromOnboarding = !!fromOnboarding;
  modal.style.display = 'flex';
  $('#authError').textContent = '';
  $('#authEmail').value = '';
  $('#authPassword').value = '';
  setAuthMode(mode);
  setTimeout(() => $('#authEmail').focus(), 100);
}
function closeAuthModal() {
  $('#authModal').style.display = 'none';
  // X yalnızca modal'ı kapatır. Onboarding ekranındaysa kullanıcı orada kalır ve
  // "Misafir devam et"i açıkça seçmeli. Auth iptali = misafir kabulü değil.
  _authFromOnboarding = false;
}
function setAuthMode(mode) {
  const forgot = $('#authForgot');
  if (mode === 'signup') {
    $('#authTitle').textContent = 'Hesap Oluştur';
    $('#authSub').textContent = 'İlerlemeni kaybetme; tüm cihazlardan eriş.';
    $('#authSubmit').textContent = 'Hesap Oluştur';
    $('#authToggle').textContent = 'Zaten hesabın var mı? Giriş yap';
    $('#authPassword').setAttribute('autocomplete', 'new-password');
    $('#authModal').dataset.mode = 'signup';
    if (forgot) forgot.hidden = true;
  } else {
    $('#authTitle').textContent = 'Giriş Yap';
    $('#authSub').textContent = 'Mevcut hesabınla devam et.';
    $('#authSubmit').textContent = 'Giriş Yap';
    $('#authToggle').textContent = 'Yeni misin? Hesap oluştur';
    $('#authPassword').setAttribute('autocomplete', 'current-password');
    $('#authModal').dataset.mode = 'signin';
    if (forgot) forgot.hidden = false;
  }
}
function bindAuthHandlers() {
  $('#authClose')?.addEventListener('click', closeAuthModal);
  $('#authToggle')?.addEventListener('click', () => {
    setAuthMode($('#authModal').dataset.mode === 'signup' ? 'signin' : 'signup');
  });
  $('#authForgot')?.addEventListener('click', async () => {
    const email = $('#authEmail').value.trim();
    const err = $('#authError');
    err.textContent = '';
    if (!email) { err.textContent = 'Önce e-postanı yaz, sonra Şifremi Unuttum\'a bas.'; return; }
    const btn = $('#authForgot');
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Gönderiliyor…';
    try {
      if (!(window.Cloud && Cloud.isReady && Cloud.isReady())) {
        try { if (window.Cloud && Cloud.init) Cloud.init(); } catch (e) {}
        const ready = await waitForCloudReady(15000);
        if (!ready) {
          err.textContent = 'Sunucuya bağlanılamadı. İnternetini kontrol edip tekrar dene.';
          return;
        }
      }
      await Cloud.sendPasswordReset(email);
      err.style.color = 'var(--success, #10B981)';
      err.textContent = 'Sıfırlama bağlantısı gönderildi. Posta kutunu kontrol et.';
      setTimeout(() => { err.style.color = ''; }, 6000);
    } catch (e) {
      const code = e.code || '';
      err.textContent = code === 'auth/invalid-email' ? 'Geçersiz e-posta.'
        : code === 'auth/user-not-found' ? 'Bu e-postayla kayıtlı kullanıcı yok.'
        : code === 'auth/network-request-failed' ? 'İnternet bağlantısı yok.'
        : (e.message || 'Bilinmeyen hata.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
  $('#authSubmit')?.addEventListener('click', async () => {
    const email = $('#authEmail').value.trim();
    const pw = $('#authPassword').value;
    const err = $('#authError');
    err.textContent = '';
    if (!email || !pw) { err.textContent = 'E-posta ve şifre gerekli.'; return; }
    if (pw.length < 6) { err.textContent = 'Şifre en az 6 karakter olmalı.'; return; }
    const mode = $('#authModal').dataset.mode || 'signup';
    // GİRİŞ YAP, mevcut hesabın bulut verisini yükler ve bu cihazdaki misafir
    // ilerlemesini onunla DEĞİŞTİRİR (uid değişimi → local sıfırlanır). Hesap Oluştur
    // (link) ilerlemeyi korur; Giriş Yap korumaz. Misafirin kaydedilmemiş XP'si varsa
    // sessizce silmek yerine önce onay al — kötü sürpriz + 1 yıldız yorum önlenir.
    const guestProgress = (store.xp || 0) > 0 || (store.totalAnswered || 0) > 0;
    const isGuest = !(window.Cloud && Cloud.isReady && Cloud.isReady() && Cloud.currentUser && Cloud.currentUser() && !Cloud.currentUser().isAnonymous);
    if (mode === 'signin' && isGuest && guestProgress) {
      showConfirm({
        title: 'Misafir ilerlemen değişecek',
        message: `Bu cihazda ${store.xp || 0} XP'lik misafir ilerlemen var. Giriş yapınca bu cihazdaki ilerleme, hesabındaki kayıtla değişir. Mevcut ilerlemeni korumak istersen "Hesap Oluştur"u kullan.`,
        confirmText: 'Yine de giriş yap',
        cancelText: 'Vazgeç',
        danger: true,
        onConfirm: () => doAuthSubmit(mode, email, pw, err),
      });
      return;
    }
    doAuthSubmit(mode, email, pw, err);
  });
}

async function doAuthSubmit(mode, email, pw, err) {
    $('#authSubmit').disabled = true;
    // Firebase CDN'den geç yüklenmiş olabilir — hazır olmasını kısa süre bekle.
    // İlk init başarısız olduysa burada tekrar tetikle (kullanıcı tekrar denediğinde
    // ağ artık varsa init succeed eder). Cloud.init idempotent: _ready true ise no-op.
    if (!(window.Cloud && Cloud.isReady && Cloud.isReady())) {
      $('#authSubmit').textContent = 'Bağlanılıyor…';
      try { if (window.Cloud && Cloud.init) Cloud.init(); } catch (e) {}
      const ready = await waitForCloudReady(15000);
      if (!ready) {
        err.textContent = 'Sunucuya bağlanılamadı. İnternetini kontrol edip tekrar dene.';
        $('#authSubmit').disabled = false;
        $('#authSubmit').textContent = mode === 'signup' ? 'Hesap Oluştur' : 'Giriş Yap';
        return;
      }
    }
    $('#authSubmit').textContent = 'Bekleyin…';
    try {
      if (mode === 'signup') await Cloud.signUpWithEmail(email, pw);
      else                   await Cloud.signInWithEmail(email, pw);
      Cloud.logEvent(mode === 'signup' ? 'sign_up' : 'login', { method: 'email' });
      Feedback.levelUp();
      // Onboarding'den gelmişse modal kapanınca özet ekranında değil, ana sayfada
      // bırak. closeAuthModal flag'i sıfırlıyor → ÖNCE oku, sonra kapat, sonra
      // navigation. (X butonu için aynı yönlendirme yok — bu sadece başarılı
      // submit yolu için geçerli; misafir kabulü değil, "hesabım var, devam et".)
      const cameFromOnboarding = _authFromOnboarding;
      closeAuthModal();
      refreshAccountUI();
      if (cameFromOnboarding) {
        const active = document.querySelector('.screen.active')?.dataset.screen;
        if (active === 'onboarding') showScreen('home');
      }
    } catch (e) {
      const code = e.code || '';
      const msg = code === 'auth/email-already-in-use' ? 'Bu e-posta zaten kayıtlı.'
        : code === 'auth/invalid-email' ? 'Geçersiz e-posta.'
        : code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'E-posta veya şifre yanlış.'
        : code === 'auth/weak-password' ? 'Şifre çok zayıf (en az 6 karakter).'
        : code === 'auth/network-request-failed' ? 'İnternet bağlantısı yok.'
        : (e.message || 'Bilinmeyen hata.');
      err.textContent = msg;
      Feedback.wrong();
    } finally {
      $('#authSubmit').disabled = false;
      $('#authSubmit').textContent = mode === 'signup' ? 'Hesap Oluştur' : 'Giriş Yap';
    }
}

// ---------- BULUT (Firebase) ----------
// Config varsa otomatik anonim auth + sync. Yoksa local-only.
(async () => {
  if (!window.Cloud) return;
  const ok = await Cloud.init();
  if (!ok) return;
  Cloud.onAuthStateChange((user) => {
    refreshAccountUI();
    if (user) {
      Cloud.logEvent('login', { method: user.isAnonymous ? 'anonymous' : 'email' });
      // RevenueCat entitlement'ını bu kullanıcıya bağla (premium cihazlar arası taşınır).
      // Premium henüz hazır değilse no-op olur; init tamamlanınca aşağıda tekrar bağlanır.
      try { Premium.linkUser(user.uid); } catch (e) {}
    }
  });
  refreshAccountUI();
  // İlk açılış olayı
  Cloud.logEvent('app_open', { theme: store.prefs?.theme || 'auto' });
})();

// Uygulama arka plana atılınca / kapanırken ilerlemeyi HEMEN buluta yaz.
// (2sn debounce'u beklemeden — kullanıcı hızlı kapatırsa veri kaybolmasın.)
function flushProgress() {
  try { saveStore(); } catch (e) {}
  try { if (window.Cloud && Cloud.isReady && Cloud.isReady() && Cloud.flushSync) Cloud.flushSync(); } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushProgress();
});
window.addEventListener('pagehide', flushProgress);

// =====================================================================
// ANDROID GERİ TUŞU — donanım/jest geri tuşunu yönet.
// Olmadan: oyun ortasında geri tuşu = uygulama kapanır (ilerleme kaybı).
// Mantık: önce açık modal'ı kapat → ekrana göre geri → home'da çift-bas-çıkış.
// =====================================================================
(function setupBackButton() {
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App || !App.addListener) return;   // web / plugin yok → no-op

  let _lastBack = 0;
  function exitToast() {
    let t = document.getElementById('backToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'backToast';
      t.className = 'back-toast';
      t.textContent = 'Çıkmak için tekrar geri bas';
      document.body.appendChild(t);
    }
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2000);
  }

  // Açık overlay/modal varsa kapat. Ele alındıysa true döner.
  function closeTopOverlay() {
    // Oyun sonucu overlay'i
    const result = document.getElementById('resultOverlay');
    if (result && result.classList.contains('show')) {
      const finalActions = document.getElementById('resultFinalActions');
      const isFinal = finalActions && finalActions.style.display !== 'none';
      const btn = document.getElementById(isFinal ? 'resultExit' : 'resultContinue');
      if (btn) btn.click(); else result.classList.remove('show');
      return true;
    }
    // confirm / hearts / prompt / level-switch modal — vazgeç/kapat
    const modal = document.querySelector('.hearts-modal-overlay.show, .confirm-overlay.show');
    if (modal) {
      const cancel = modal.querySelector('.confirm-no, .hearts-modal-close');
      if (cancel) cancel.click(); else modal.classList.remove('show');
      return true;
    }
    return false;
  }

  // Ekran → o ekranın kapatma butonu (mevcut davranışı aynen kullan: onay/timer dahil)
  const CLOSE_BTN = {
    flash: '#flashClose', quiz: '#quizClose', exam: '#examClose',
    verbs: '#verbsClose', order: '#orderClose', match: '#matchClose',
    listen: '#listenClose', movie: '#movieClose', story: '#storyClose',
    'false-friends': '#ffClose', 'stories-menu': '#storiesMenuClose',
    leaderboard: '#lbClose', paywall: '#paywallClose', mistakes: '#mistakesClose',
  };

  App.addListener('backButton', () => {
    // 1) Açık modal/overlay'i kapat
    if (closeTopOverlay()) return;

    const active = document.querySelector('.screen.active')?.dataset.screen || 'home';

    // 2) Onboarding'de geri tuşu = yanlışlıkla çıkmasın
    if (active === 'onboarding') return;

    // 3) Ekranın kapatma butonu varsa onun davranışını uygula (oyunlarda onay sorar)
    const sel = CLOSE_BTN[active];
    if (sel) {
      const btn = document.querySelector(sel);
      if (btn) { btn.click(); return; }
    }

    // 4) Alt-nav ekranları (games/profile) → ana sayfaya dön
    if (active === 'games' || active === 'profile') { showScreen('home'); return; }

    // 5) Ana sayfa (veya bilinmeyen) → çift-bas-çıkış
    const now = Date.now();
    if (now - _lastBack < 2000) {
      try { App.exitApp(); } catch (e) {}
    } else {
      _lastBack = now;
      exitToast();
    }
  });
})();

// ---------- PREMIUM (RevenueCat) + REKLAMLAR (AdMob) ----------
// Önce premium durumunu öğren (reklam kararından ÖNCE), sonra premium değilse
// reklamları hazırla. Banner alt nav görünen ekranlarda gösterilir.
(async () => {
  // 0) iOS ATT — Premium/Ads kararından ÖNCE, app açılır açılmaz iste
  // (Apple review 10 Haz 2026: popup görünmüyordu — manuel çağrı şart)
  try {
    if (window.Capacitor?.getPlatform?.() === 'ios') {
      const AdMobPlugin = window.Capacitor?.Plugins?.AdMob;
      if (AdMobPlugin) {
        const res = await AdMobPlugin.trackingAuthorizationStatus();
        if (res && res.status === 'notDetermined') {
          await AdMobPlugin.requestTrackingAuthorization();
        }
      }
    }
  } catch (e) { console.warn('[Kelimoli] ATT preflight failed:', e); }

  // 1) RevenueCat'i yapılandır + mevcut entitlement durumunu çek
  try { await Premium.init(); } catch (e) {}
  try { refreshPremiumBanner(); } catch (e) {}
  // Premium hazır olduğunda mevcut Firebase kullanıcısını bağla (auth callback'i
  // Premium'dan önce çalışmış olabilir — burada garanti altına alıyoruz).
  try {
    const u = window.Cloud && Cloud.currentUser && Cloud.currentUser();
    if (u) Premium.linkUser(u.uid);
  } catch (e) {}

  // 2) Premium değilse reklamları hazırla
  if (Premium.isPremium()) return;
  const ok = await Ads.init();
  if (!ok) return;
  Ads.prepareInterstitial();
  Ads.prepareRewarded();
  // Init geç tamamlandıysa: o an açık olan ekran için banner'ı tetikle
  const active = document.querySelector('.screen.active')?.dataset.screen;
  const hideNav = ['movie', 'onboarding', 'listen', 'false-friends', 'stories-menu', 'story', 'leaderboard', 'paywall'];
  if (active) Ads.syncBanner(active, !hideNav.includes(active));
})();
if (!store.onboarded) {
  setOnbStep(1);
  showScreen('onboarding');
} else {
  showScreen('home');
}

// Açılış splash'ını yumuşakça kapat — animasyon oynasın diye kısa bir süre göster.
(function hideAppSplash() {
  const splash = document.getElementById('appSplash');
  if (!splash) return;
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => { try { splash.remove(); } catch (e) {} }, 700);
  }, 1400);
})();

// =====================================================================
// SERVICE WORKER — offline destek + "ana ekrana ekle" için gerekli
// Sadece http(s) ortamında kaydet; file:// üzerinde service worker çalışmaz.
// Capacitor native (Android/iOS) içinde dosyalar zaten yerelde paketli;
// SW hiçbir fayda sağlamadığı gibi 'localhost' WebView'de kaydı başarısız
// olup konsola hata basıyor — bu yüzden native ortamda atlanıyor.
// =====================================================================
const _isCapacitorNative = !!(window.Capacitor && (
  typeof window.Capacitor.isNativePlatform === 'function'
    ? window.Capacitor.isNativePlatform()
    : window.Capacitor.isNative
));
// Localhost (geliştirme) — SW faydası yok, sadece eski CSS/JS cache derdine yol açar.
// Eski bir SW kayıtlıysa onu da kaldır ki taze kod yüklensin.
const _isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if ('serviceWorker' in navigator && _isLocalhost) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
  if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
}
// Service worker'ı YALNIZCA gerçek https deployment'ta kaydet (localhost hariç).
if ('serviceWorker' in navigator && !_isCapacitorNative && !_isLocalhost && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        // Yeni sürüm bulunca arka planda hazırlar; bir sonraki açılışta devreye girer
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // İsteğe bağlı: kullanıcıya "güncelleme hazır" göstergesi
              console.info('[Kelimoli] Yeni sürüm hazır — uygulamayı yeniden açtığında yüklenecek.');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[Kelimoli] Service worker kaydı başarısız:', err);
      });
  });
}
