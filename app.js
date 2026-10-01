/* Dod — arab tili ilovasi.
   Savollar botdagi quiz.py bilan bir xil tuziladi. Natijalar, reyting, duel va ustoz paneli —
   Supabase bazasida (faqat xavfsiz funksiyalar orqali, har chaqiruvda token tekshiriladi). */
(() => {
  "use strict";
  const D = window.DOD_DATA;
  const API = "https://fstmvfroylwyelmaxhzh.supabase.co/rest/v1/rpc/";
  const API_KEY = "sb_publishable_dNWgUrggq3AEbr4Ifu74Cg_8iq3K1Nm";   // ochiq kalit — ilovada turishi xavfsiz
  const K_TOKEN = "dod_token", K_TEACHER = "dod_teacher", K_MODE = "dod_mode", K_REF = "dod_ref",K_PENDING = "dod_pending", K_CACHE = "dod_cache";

  const TIMER = 15, FAST = 5, PASS = 80, XP_OK = 10, XP_FAST = 5, XP_MISSION = 20, XP_EXAM = 50, XP_WOTD = 5, DAILY_CAP = 700;
  const REVIEW_NEEDED = 2, DUEL_QUESTIONS = 7, DUEL_LAST_LESSONS = 3;

  const RANKS = [[0, "🌱 Yangi boshlovchi"], [100, "📖 Harf ovchisi"], [300, "⭐ So'z ustasi"], [700, "🏅 Dod bilimdoni"], [1500, "👑 Dod qiroli"]];
  const SIMILAR = ["بتثني", "جحخ", "دذ", "رز", "سش", "صض", "طظ", "عغ", "فق", "كلمهـوأ"];
  const SKILLS = { reading: "📖 O'qish va lug'at", grammar: "✏️ Grammatika", listening: "🎧 Tinglash", writing: "✍️ Yozish" };
  const EXAM_PLAN = [["reading", 8], ["grammar", 6], ["listening", 6]];
  const WH = ["مَنْ هَذَا؟", "مَنْ هَذِهِ؟", "مَا هَذَا؟", "مَا هَذِهِ؟"];
  const DEMO = ["هَذَا", "هَذِهِ"];
  const SHOWN = {
    num: ["🔢 <b>{s}</b> raqami arabchada qanday aytiladi?", "🎧 Qaysi raqam aytildi?"],
    time: ["🕗 Soat <b>{s}</b>. Arabchada qanday aytiladi?", "🎧 Soat nechi dedi?"],
    color: ["🎨 <b>{s}</b> rang arabchada qanday? (muzakkar)", "🎧 Qaysi rang aytildi?"],
    day: ["📅 <b>{s}</b> arabchada qanday?", "🎧 Qaysi kun aytildi?"],
    month: ["🗓 <b>{s}</b> oyi arabchada qanday?", "🎧 Qaysi oy aytildi?"],
    season: ["🍂 <b>{s}</b> fasli arabchada qanday?", "🎧 Qaysi fasl aytildi?"],
  };
  const BADGES = [
    ["first", "🌱", "Birinchi qadam", "Birinchi kunlik missiya"],
    ["fire7", "🔥", "Olovli hafta", "7 kun ketma-ket"],
    ["fire30", "🌋", "Olovli oy", "30 kun ketma-ket"],
    ["flash", "⚡", "Chaqmoq", "Missiyada 5 ta tez javob"],
    ["perfect", "💯", "Mukammal", "Darsdan 100%"],
    ["lessons3", "📚", "Bilimdon", "3 ta dars o'tildi"],
    ["duel1", "⚔️", "Birinchi g'alaba", "Duelda yuting"],
    ["ear50", "🎧", "O'tkir quloq", "Tinglashda 50 ta to'g'ri"],
    ["speak10", "🎙", "Notiq", "10 ta ovozli javob baholandi"],
    ["fixer20", "🩹", "Xatolar ustasi", "20 ta xato tuzatildi"],
    ["wotd10", "☀️", "Erta qush", "10 ta kun so'zi"],
    ["exam", "🎓", "Imtihon sinovi", `Imtihondan ${PASS}%+`],
    ["xp1000", "⭐", "Ming ball", "Jami 1000 XP"],
    ["elchi", "🤝", "Elchi", "3 ta do'stni olib keldi"],
  ];
  const ERRORS = {
    BAD_CODE: "Guruh kodi noto'g'ri. Ustozingizdan so'rang.",
    BAD_NAME: "Ismingizni to'liq yozing (2–30 harf).",
    BAD_PIN: "PIN 4 ta raqamdan iborat bo'lishi kerak.",
    NAME_TAKEN: "Bu ism guruhda band. «Menda hisob bor» bo'limidan kiring yoki familiyangizni ham qo'shing.",
    BAD_LOGIN: "Ism yoki PIN noto'g'ri. PIN'ni unutgan bo'lsangiz, ustozingiz yangilab beradi.",
    LOCKED: "Ko'p marta xato kiritildi. 10 daqiqadan keyin qayta urinib ko'ring.",
    AUTH: "Hisobingizga qayta kiring.",
    NET: "Internet bilan aloqa yo'q. Tekshirib, qayta urinib ko'ring.",
    SPEAK_LIMIT: "Bugun 3 ta javob yubordingiz. Ertaga davom etamiz! 💪",
    AUDIO_TOO_BIG: "Yozuv juda uzun. Qisqaroq qilib qayta yozing.",
    BAD_AUDIO: "Yozuv juda qisqa yoki buzilgan. Qayta yozib ko'ring.",
    NOT_FOUND: "Topilmadi (ovoz 30 kundan keyin o'chiriladi).",
    BAD_SCORE: "Bahoni 1 dan 5 gacha tanlang.",
    BAD_TEACHER_LOGIN: "Guruh kodi yoki ustoz paroli noto'g'ri.",
    NO_PASSWORD: "Bu guruh uchun ustoz paroli hali o'rnatilmagan. Avval ustoz havolasi orqali kirib, ⚙️ bo'limida parol o'rnating.",
    BAD_PASSWORD: "Parol kamida 6 ta belgidan iborat bo'lsin.",
    TEACHER_AUTH: "Ustoz seansi tugagan. Qaytadan kiring.",
  };

  // ---------- Yordamchilar ----------
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const isAr = s => /[؀-ۿ]/.test(s);
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* xotira yopiq */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
  };

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3000);
  }

  // ---------- Server bilan aloqa ----------
  async function rpc(fn, args) {
    let res;
    try {
      res = await fetch(API + fn, {
        method: "POST",
        headers: { apikey: API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(args || {}),
      });
    } catch { throw new Error("NET"); }
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((body && body.message) || "NET");
    if (body && body.error) throw new Error(body.error);
    return body;
  }
  const errText = e => ERRORS[e.message] || "Xatolik yuz berdi. Qayta urinib ko'ring.";

  // ---------- Holat ----------
  // S — talabaning o'quv holati (bazada saqlanadi). ME — server bergan ma'lumot (ism, XP, guruh).
  const fresh = () => ({ streak: 0, lastMission: null, lessons: {}, days: {}, daily: {}, dstart: null, mistakes: {}, c: {}, badges: [], wotd: {}, examBest: 0 });
  let S = fresh(), ME = null, TOKEN = store.get(K_TOKEN);
  const today = () => (ME && ME.today) || new Date().toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const yesterday = () => addDays(today(), -1);
  const bump = (k, by = 1) => (S.c[k] = (S.c[k] || 0) + by);
  const streakNow = () => (S.lastMission && S.lastMission >= yesterday() ? S.streak : 0);
  const rankOf = xp => RANKS.filter(r => xp >= r[0]).pop()[1];

  // Natija saqlanmay qolsa (internet yo'q), navbatga qo'yiladi va keyin yuboriladi
  const pending = () => { try { return JSON.parse(store.get(K_PENDING) || "[]"); } catch { return []; } };
  async function saveResult(practice, bonus, kind, answers) {
    const item = { practice, bonus, kind, answers };
    try {
      const r = await rpc("save_result", { p_token: TOKEN, p_state: S, p_practice: practice, p_bonus: bonus, p_kind: kind, p_answers: answers });
      ME.xp = r.xp; ME.practice_today = r.practice_today;
      store.set(K_CACHE, JSON.stringify({ ME, S }));
      flushPending();
      return r;
    } catch (e) {
      if (e.message === "AUTH") return logout(true);
      const q = pending(); q.push(item); store.set(K_PENDING, JSON.stringify(q.slice(-20)));
      store.set(K_CACHE, JSON.stringify({ ME, S }));
      return { granted: practice, bonus, offline: true };
    }
  }
  async function flushPending() {
    const q = pending(); if (!q.length) return;
    store.set(K_PENDING, "[]");
    for (const it of q) {
      try { const r = await rpc("save_result", { p_token: TOKEN, p_state: S, p_practice: it.practice, p_bonus: it.bonus, p_kind: it.kind, p_answers: it.answers }); ME.xp = r.xp; }
      catch { const left = pending(); left.push(it); store.set(K_PENDING, JSON.stringify(left)); break; }
    }
  }

  // ---------- Ovoz ----------
  let player = null;
  function play(text) {
    const file = D.audio[text];
    if (!file) return;
    playSeq.id = (playSeq.id || 0) + 1;   // ketma-ket o'qish ketayotgan bo'lsa, to'xtaydi
    try { if (player) player.pause(); player = new Audio("audio/" + file); player.play().catch(() => toast("🔊 Ovozni yoqish uchun ekranga bir marta bosing")); } catch { /* ovozsiz davom */ }
  }
  // Bir nechta gapni ketma-ket o'qish (suhbat, matn). onLine(i) — qaysi gap o'qilyapti, oxirida onLine(-1)
  function playSeq(texts, onLine) {
    const id = (playSeq.id = (playSeq.id || 0) + 1);
    let i = 0;
    const next = () => {
      if (id !== playSeq.id) return;
      if (i >= texts.length) return onLine && onLine(-1);
      const file = D.audio[texts[i]];
      onLine && onLine(i); i++;
      if (!file) return next();
      try {
        if (player) player.pause();
        player = new Audio("audio/" + file);
        player.onended = () => setTimeout(next, 350);
        player.play().catch(() => toast("🔊 Ovozni yoqish uchun ekranga bir marta bosing"));
      } catch { /* ovozsiz */ }
    };
    next();
  }

  // ---------- Darslar ----------
  // Tartib: Pre-A1 (1–13), keyin A1 bo'limlari (101, 102, ...). Ustoz ochgan darslar soni shu tartib bo'yicha
  const ORDER = D.lessons.map(l => l.number);
  const lesson = n => D.lessons.find(l => l.number === n);
  const nextOf = n => ORDER[ORDER.indexOf(n) + 1];
  const prevOf = n => ORDER[ORDER.indexOf(n) - 1];
  const lname = n => n > 100 ? `A1 ${n - 100}-bo'lim` : `${n}-dars`;   // "3-dars" yoki "A1 2-bo'lim"
  const passed = n => (S.lessons[n] || 0) >= PASS;
  // Har bir daraja ustoz tomonidan alohida ochiladi: Pre-A1 — open_lessons, A1 — open_a1
  const levelOf = n => (lesson(n) || {}).level || "Pre-A1";
  const OPEN_FIELD = { "Pre-A1": "open_lessons", "A1": "open_a1" };
  const openCount = (code, g = ME && ME.group) => (g ? g[OPEN_FIELD[code]] || 0 : code === "Pre-A1" ? 1 : 0);
  const teacherOpened = n => (n > 100 ? n - 100 : n) <= openCount(levelOf(n));
  // Darajaning birinchi darsi oldingi darajani tugatishni talab qilmaydi (ustoz ochgani yetarli)
  const isOpen = n => teacherOpened(n) && (!prevOf(n) || levelOf(prevOf(n)) !== levelOf(n) || passed(prevOf(n)));
  const openLessons = () => D.lessons.filter(l => isOpen(l.number));
  const groupLessons = () => D.lessons.filter(l => teacherOpened(l.number));

  // ---------- Savol tuzish (botdagi quiz.py ning aynan o'zi) ----------
  function options(correct, pool, k = 4) {
    const others = shuffle([...new Set(pool)].filter(p => p !== correct)).slice(0, k - 1);
    const opts = shuffle([...others, correct]);
    return [opts, opts.indexOf(correct)];
  }
  function similarPool(ch, letters, field = "name") {
    const g = SIMILAR.find(x => x.includes(ch)) || "";
    let names = letters.filter(l => g.includes(l.char) && l.char !== ch).map(l => l[field]);
    if (names.length < 3) names = names.concat(shuffle(letters.filter(l => !names.includes(l[field]) && l.char !== ch).map(l => l[field])).slice(0, 3 - names.length));
    return names;
  }
  const sameKind = (w, words) => words.filter(x => (x.pos || "") === (w.pos || ""));
  const Q = (maker, skill, topic, text, [opts, correct], extra = {}) => ({ key: `${maker}:${topic}`, skill, topic, text, options: opts, correct, ...extra });

  const M = {
    ar2uz: d => { const w = pick(d.words); return Q("ar2uz", "reading", w.ar, `<b>${w.ar}</b>\n\nBu so'z nima degani?`, options(w.uz, sameKind(w, d.words).map(x => x.uz)), { hint: `${w.ar}: ${w.uz}`, audio: w.ar }); },
    uz2ar: d => { const w = pick(d.words); return Q("uz2ar", "reading", w.ar, `<b>«${cap(w.uz)}»</b> arabchada qanday bo'ladi?`, options(w.ar, sameKind(w, d.words).map(x => x.ar))); },
    letter: d => { const l = pick(d.letters); return Q("letter", "reading", l.char, `<b>${l.char}</b>\n\nBu harfning nomi nima?`, options(l.name, [...similarPool(l.char, d.letters), l.name])); },
    phrase: d => { const p = pick(d.phrases); return Q("phrase", "reading", p.ar, `<b>${p.ar}</b>\n\nBu ibora nima degani?`, options(p.uz, d.phrases.map(x => x.uz))); },
    shown: d => { const s = pick(d.shown); const same = d.shown.filter(x => x.kind === s.kind); return Q("shown", "reading", s.ar, SHOWN[s.kind][0].replace("{s}", s.shown), options(s.ar, same.map(x => x.ar))); },
    dialog: d => { const x = pick(d.dialogs); return Q("dialog", "grammar", x.say, `Sizga <b>«${x.say}»</b> deyishdi.\n\nQanday javob berasiz?`, options(x.reply, d.dialogs.map(y => y.reply))); },
    first: d => { const w = pick(d.words.filter(x => x.letter)); return Q("first", "grammar", w.ar, `<b>«${cap(w.uz)}»</b> arabchada qaysi harf bilan boshlanadi?`, options(w.letter, d.letters.map(l => l.char)), { hint: `${cap(w.uz)}: ${w.ar}` }); },
    demo: d => { const x = pick(d.demonstratives); return Q("demo", "grammar", x.word, `Bo'sh joyga nima qo'yiladi?\n\n<b>...... ${x.word}</b>`, [DEMO, x.fem ? 1 : 0], { hint: "هَذَا: muzakkar (erkak jinsi), هَذِهِ: muannas (ayol jinsi, ko'pincha ة bilan tugaydi)" }); },
    wh: d => { const x = pick(d.wh); return Q("wh", "grammar", x.answer, `Javob: <b>«${x.answer}»</b>\n\nSavol qanday bo'lgan?`, [WH, WH.indexOf(x.question)], { hint: "مَنْ: odam uchun, مَا: narsa va hayvon uchun" }); },
    fill: d => { const x = pick(d.fills); return Q("fill", "grammar", x.topic || x.a, x.q, options(x.a, [...x.opts, x.a]), x.hint ? { hint: x.hint } : {}); },
    l_word: d => { const w = pick(d.words); return Q("l_word", "listening", w.ar, "🎧 Eshiting. Qaysi so'z aytildi?", options(w.ar, sameKind(w, d.words).map(x => x.ar)), { audio: w.ar, hint: `${w.ar}: ${w.uz}` }); },
    l_mean: d => { const w = pick(d.words); return Q("l_mean", "listening", w.ar, "🎧 Eshiting. Bu so'z nima degani?", options(w.uz, sameKind(w, d.words).map(x => x.uz)), { audio: w.ar, hint: `${w.ar}: ${w.uz}` }); },
    l_letter: d => { const l = pick(d.letters); return Q("l_letter", "listening", l.char, "🎧 Eshiting. Qaysi harf aytildi?", options(l.char, [...similarPool(l.char, d.letters, "char"), l.char]), { audio: l.name, hint: `${l.char}: ${l.name}` }); },
    l_dialog: d => { const x = pick(d.dialogs); return Q("l_dialog", "listening", x.say, "🎧 Suhbatdoshingiz gapini eshiting.\n\nUnga qaysi <b>javob</b> mos keladi?", options(x.reply, d.dialogs.map(y => y.reply)), { audio: x.say, hint: `Aytilgani: ${x.say}` }); },
    l_shown: d => { const s = pick(d.shown); const same = d.shown.filter(x => x.kind === s.kind); return Q("l_shown", "listening", s.ar, SHOWN[s.kind][1], options(s.shown, same.map(x => x.shown)), { audio: s.ar, hint: `${s.shown}: ${s.ar}` }); },

    // ---- A1 uchun yangi turlar (ko'rsatma arabcha, ostida o'zbekcha izoh) ----
    // 🙃 Ortiqcha so'z: bir guruhdan 3 ta so'z + boshqa (ma'nosi uzoq) guruhdan 1 ta
    odd: d => {
      const g = pick(oddGroups(d));
      const three = shuffle(g.words).slice(0, 3);
      const odd = pick(d.words.filter(x => x.pos && x.pos !== g.pos && !near(x.pos, g.pos)));
      const all = [...three, odd];
      return Q("odd", "reading", odd.ar, "", options(odd.ar, all.map(x => x.ar)),
        { type: "odd", ins: INS.odd, gloss: shuffle(all).map(x => [x.ar, x.uz]), hint: `${odd.ar}: ${odd.uz}` });
    },
    // 🧩 Gap tuzish: so'zlarni to'g'ri tartibda bosish
    order: d => {
      const src = orderSources(d), s = pick(src);
      const words = s.ar.split(/\s+/);
      let tiles = shuffle(words);
      for (let t = 0; t < 5 && tiles.join(" ") === s.ar; t++) tiles = shuffle(words);
      return { key: `order:${s.ar}`, type: "order", skill: "grammar", topic: s.ar, ins: INS.order, text: s.ctx, answer: words, tiles, hint: s.hint };
    },
    // 🔗 Juftini top: 5 ta arabcha ↔ o'zbekcha juftlik
    match: d => {
      const seenUz = new Set(), pairs = [];
      for (const w of shuffle(d.words)) {
        if (seenUz.has(w.uz)) continue;
        seenUz.add(w.uz); pairs.push({ ar: w.ar, uz: w.uz });
        if (pairs.length === 5) break;
      }
      return { key: `match:${pairs.map(p => p.ar).sort().join(",")}`, type: "match", skill: "reading", topic: pairs[0].ar, ins: INS.match, text: "", pairs, left: shuffle(pairs.map(p => p.ar)), right: shuffle(pairs.map(p => p.uz)) };
    },
  };

  const INS = {
    odd: ["أَيُّ كَلِمَةٍ مُخْتَلِفَةٌ؟", "Qaysi so'z ortiqcha? (qolgan uchtasiga o'xshamaydi)"],
    order: ["رَتِّبِ الْكَلِمَاتِ", "So'zlarni to'g'ri tartibda bosing"],
    match: ["صِلْ كُلَّ كَلِمَةٍ بِمَعْنَاهَا", "Har bir so'zni ma'nosi bilan juftlang"],
  };
  // Ma'nosi yaqin guruhlar — ortiqcha so'z shulardan olinmaydi (meva ham ovqat, xona ham joy...)
  const NEAR = [["food", "drink", "fruit", "meal", "vegetable", "kitchen"], ["place", "room", "city", "country"], ["room", "furniture", "appliance", "kitchen"],
    ["sport", "hobby"], ["time", "freq", "season", "weather"], ["body", "illness", "medicine"], ["adj", "comparative", "color", "weather"], ["job", "family"],
    ["adverb", "direction", "place"]];
  const near = (a, b) => NEAR.some(g => g.includes(a) && g.includes(b));
  const oddGroups = d => {
    const by = {};
    (d.words || []).forEach(w => { if (w.pos) (by[w.pos] = by[w.pos] || []).push(w); });
    return Object.entries(by).filter(([, ws]) => ws.length >= 3).map(([pos, words]) => ({ pos, words }))
      .filter(g => d.words.some(x => x.pos && x.pos !== g.pos && !near(x.pos, g.pos)));
  };
  // Gap tuzish uchun gaplar: iboralar (o'zbekcha tarjimasi bilan) va suhbat javoblari (savoli bilan); 3–7 so'z
  const orderSources = d => {
    const ok = s => { const n = s.split(/\s+/).length; return n >= 3 && n <= 7; };
    return [
      ...(d.phrases || []).filter(p => ok(p.ar)).map(p => ({ ar: p.ar, ctx: `<b>«${cap(p.uz)}»</b>` })),
      ...(d.dialogs || []).filter(x => ok(x.reply)).map(x => ({ ar: x.reply, ctx: `<b>${x.say}</b>\n— Javobni tuzing` })),
    ];
  };

  // ---------- A1 kunlik topshiriqlar (Cambridge uslubi) ----------
  // Har unit bir necha kunga bo'lingan (unit.days). Har kuni: Daily Tasks (4 qism) + alohida Yozish.
  const DAILY = [["grammar", "✏️", "Grammatika"], ["vocab", "📚", "Lug'at"], ["listening", "🎧", "Tinglash"], ["reading", "📖", "O'qish"]];
  const PARTS = [...DAILY, ["writing", "✍️", "Yozish"]];
  const partLabel = p => PARTS.find(x => x[0] === p).slice(1).join(" ");
  // Kunlik tizim vaqtincha o'chiq (ustoz qarori, 2026-10-01: guruhlar yig'ilganda yoqiladi). O'chiq paytda A1 oddiy dars bo'lib ishlaydi.
  const DAILY_ON = false;
  const hasParts = n => DAILY_ON && !!(lesson(n) || {}).days;
  // Kun ma'lumoti: unitning so'zlari va grammatikasi kunlarga teng bo'linadi, matnlar kunning o'zidan
  const share = (arr, k, of) => { if (!arr) return arr; const n = Math.ceil(arr.length / of); return arr.slice(k * n, (k + 1) * n); };
  const dayData = (n, k) => { const u = lesson(n), of = u.days.length; return { ...u, ...u.days[k], allWords: u.words, words: share(u.words, k, of), fills: share(u.fills, k, of) }; };
  // S.days[n][k][part] — eng yaxshi natija (istalgan vaqtda, mashq ham); S.daily[sana] — o'sha kuni bajarilgani (ball shu)
  const dayScore = (n, k, p) => (((S.days || {})[n] || {})[k] || {})[p];
  const dayDone = (n, k, list = PARTS) => list.filter(([p]) => (dayScore(n, k, p) || 0) >= PASS).length;
  const onTime = (date, p) => ((S.daily || {})[date] || { parts: {} }).parts[p];
  const TF = ["صَحِيحٌ", "خَطَأٌ"];
  const HARAKAT = /[ً-ْٰـ]/g;
  Object.assign(INS, {
    spell: ["رَتِّبِ الْحُرُوفَ", "Harflardan so'z yig'ing"],
    gap: ["أَكْمِلْ بِكَلِمَةٍ مِنَ النَّصِّ", "Matndagi so'z bilan to'ldiring"],
    tf: ["صَحِيحٌ أَمْ خَطَأٌ؟", "To'g'rimi yoki noto'g'ri?"],
    lmc: ["اِسْتَمِعْ ثُمَّ أَجِبْ", "Tinglang va javob bering"],
    dict: ["اُكْتُبْ مَا تَسْمَعُ", "Eshitganingizni arabcha yozing"],
    trans: ["اُكْتُبْ بِالْعَرَبِيَّةِ", "Arabchada yozing"],
  });
  const spellable = d => d.words.filter(w => {
    const n = Array.from(w.ar.replace(HARAKAT, "")).length;
    return !/\s/.test(w.ar) && n >= 3 && n <= 7;
  });
  const spellQ = w => {
    const letters = Array.from(w.ar.replace(HARAKAT, ""));
    let tiles = shuffle(letters);
    for (let t = 0; t < 5 && tiles.join("") === letters.join(""); t++) tiles = shuffle(letters);
    return { key: `spell:${w.ar}`, type: "spell", skill: "reading", topic: w.ar, ins: INS.spell, text: `<b>«${cap(w.uz)}»</b>`, audio: w.ar, answer: letters, tiles, joiner: "", hint: `${w.ar}: ${w.uz}` };
  };
  // Bir xil savol takrorlanmasin: maker'ni bir necha marta chaqirib, yangilarini olamiz
  const several = (fn, k, seen) => { const out = []; for (let t = 0; out.length < k && t < k * 20; t++) { const q = fn(); if (!seen.has(q.key)) { seen.add(q.key); out.push(q); } } return out; };
  const PART_BUILD = {
    vocab: d => {
      const seen = new Set();
      return [...shuffle(spellable(d)).slice(0, 4).map(spellQ), ...several(() => M.match(d), 2, seen),
        ...(w => oddGroups(w).length ? several(() => M.odd(w), 2, seen) : [])({ ...d, words: d.allWords || d.words }), ...several(() => M.uz2ar(d), 2, seen)];
    },
    grammar: d => {
      const seen = new Set();
      return [...(d.fills || []).length ? several(() => M.fill(d), 4, seen) : [], ...orderSources(d).length ? several(() => M.order(d), 3, seen) : [],
        ...(d.dialogs || []).length ? several(() => M.dialog(d), 2, seen) : []];
    },
    reading: d => {
      const r = d.reading, passage = { title: r.title, text: r.text };
      return [
        ...r.gaps.map(g => ({ ...Q("gap", "reading", g.q, `<b>${g.q}</b>`, options(g.a, [...g.opts, g.a])), ins: INS.gap, passage, hint: g.uz })),
        ...r.tf.map(t => ({ ...Q("tf", "reading", t.s, `<b>${t.s}</b>`, [TF, t.ok ? 0 : 1]), ins: INS.tf, passage, hint: t.uz })),
      ];
    },
    listening: d => {
      const l = d.listening, dialog = l.lines.map(x => (x.who === "f" ? "F|" : "") + x.ar);
      return [
        ...l.tf.map(t => ({ ...Q("ltf", "listening", t.s, `<b>${t.s}</b>`, [TF, t.ok ? 0 : 1]), ins: INS.tf, dialog, hint: t.uz })),
        ...(l.mc || []).map(m => ({ ...Q("lmc", "listening", m.q, `<b>${m.q}</b>`, options(m.a, [...m.opts, m.a])), ins: INS.lmc, dialog, hint: m.uz })),
      ];
    },
    writing: d => {
      const w = d.writing;
      return [
        ...shuffle(w.dictation).slice(0, 3).map(a => ({ key: `dict:${a}`, type: "write", skill: "writing", topic: a, ins: INS.dict, text: "", audio: a, answer: a })),
        ...shuffle(w.translate).slice(0, 3).map(t => ({ key: `trans:${t.ar}`, type: "write", skill: "writing", topic: t.ar, ins: INS.trans, text: `<b>«${t.uz}»</b>`, answer: t.ar })),
      ];
    },
  };

  function makers(d, skills, interactive = false) {
    const m = [], w = d.words || [], a1 = d.level === "A1";
    if (skills.includes("reading")) {
      if (w.length) m.push("ar2uz", "ar2uz", "uz2ar", "uz2ar");
      if (d.letters) m.push("letter", "letter");
      if (d.phrases) m.push("phrase");
      if (d.shown) m.push("shown", "shown");
      if (a1 && oddGroups(d).length) m.push("odd", "odd");
      if (a1 && interactive && w.length >= 8) m.push("match", "match");
    }
    if (skills.includes("grammar")) {
      if (d.fills) m.push("fill", "fill", "fill");
      if (w.some(x => x.letter) && (d.letters || []).length <= 6) m.push("first", "first");
      if (d.demonstratives) m.push("demo", "demo");
      if (d.wh) m.push("wh", "wh");
      if (d.dialogs) m.push("dialog");
      if (a1 && interactive && orderSources(d).length) m.push("order", "order", "order");
    }
    if (skills.includes("listening")) {
      if (w.length) m.push("l_word", "l_word", "l_mean", "l_mean");
      if (d.letters) m.push("l_letter");
      if (d.dialogs) m.push("l_dialog");
      if (d.shown) m.push("l_shown", "l_shown");
    }
    return m;
  }

  // interactive: gap tuzish va juftini top — faqat vaqtsiz dars testida (missiya, duel, imtihonda emas)
  function build(lessons, count, skills = ["reading", "grammar"], interactive = false) {
    lessons = lessons.filter(l => makers(l, skills).length);
    const out = [], seen = new Set();
    for (let t = 0; lessons.length && out.length < count && t < count * 30; t++) {
      const d = pick(lessons);
      const q = M[pick(makers(d, skills, interactive))](d);
      if (seen.has(q.key)) continue;
      seen.add(q.key); out.push(q);
    }
    return out;
  }
  const buildExam = lessons => EXAM_PLAN.flatMap(([sk, n]) => build(lessons, n, [sk]));
  function reshuffle(q) {
    if (q.type === "order" || q.type === "spell") return { ...q, tiles: shuffle(q.answer) };
    if (q.type === "match") return { ...q, left: shuffle(q.left), right: shuffle(q.right) };
    if (q.type === "write") return q;
    const right = q.options[q.correct];
    const opts = [WH, DEMO, TF].some(f => q.options.join() === f.join()) ? q.options.slice() : shuffle(q.options);
    return { ...q, options: opts, correct: opts.indexOf(right) };
  }

  // Savol matni: arabcha qatorlar katta harf bilan
  function promptHtml(text) {
    return text.split("\n").filter(l => l.trim()).map(line => {
      const plain = line.replace(/<[^>]+>/g, "");
      const ar = (plain.match(/[؀-ۿ]/g) || []).length, lat = (plain.match(/[A-Za-z]/g) || []).length;
      if (ar > lat) return `<div class="ar ar-line ${plain.length < 14 ? "huge" : ""}">${line}</div>`;
      return `<div class="p-line">${line}</div>`;
    }).join("");
  }

  // ---------- Test ----------
  let run = null;
  const RING = 2 * Math.PI * 19;
  const CFG = {
    mission: { title: "Kunlik missiya", timed: true },
    lesson: { title: "Dars testi", timed: false },
    listen: { title: "Tinglash", timed: false },
    review: { title: "Xatolarim", timed: false },
    daily: { title: "Kunlik topshiriq", timed: false },
    exam: { title: "CEFR sinov imtihoni", timed: false },
    duel: { title: "⚔️ Duel", timed: true },
  };

  function startRun(kind, qs, extra = {}) {
    if (!qs.length) return toast("Savollar topilmadi");
    run = { kind, qs, i: 0, right: 0, fast: 0, fixed: 0, practice: 0, answers: [], bySkill: {}, timeUsed: 0, ...CFG[kind], ...extra };
    $("#quiz").hidden = false;
    document.body.style.overflow = "hidden";
    showQ();
  }

  function closeRun() {
    if (run) clearInterval(run.timer);
    if (player) player.pause();
    run = null; $("#quiz").hidden = true; document.body.style.overflow = "";
    render();
  }

  // 🎧 Tinglash qismi: avval suhbat to'liq eshittiriladi, keyin savollar
  function showIntro() {
    const q = run.qs[0];
    $("#quiz-in").innerHTML = `
      <div class="quiz-top"><button class="x" data-quit aria-label="Chiqish">✕</button><div class="progress"><i style="width:0"></i></div></div>
      <div class="q-meta">${esc(run.title)}</div>
      <div class="q-card intro"><div class="q-ins"><div class="ar">اِسْتَمِعْ إِلَى الْحِوَارِ</div><small>Avval suhbatni diqqat bilan tinglang, keyin savollar beriladi</small></div>
        <button class="listen big-listen" id="in-play" aria-label="Tinglash">▶</button>
        <div class="muted" id="in-st">${q.dialog.length} ta gap</div></div>
      <button class="btn btn-brand btn-block" id="in-go" disabled>Savollarga o'tish →</button>`;
    $("[data-quit]").onclick = closeRun;
    const go = () => playSeq(q.dialog, i => {
      if (!$("#in-st")) return;
      $("#in-st").textContent = i < 0 ? "✅ Tinglab bo'ldingiz. Kerak bo'lsa yana tinglang" : `🔊 ${i + 1}/${q.dialog.length}-gap…`;
      $("#in-play").textContent = i < 0 ? "↻" : "🔊";
      if (i < 0) $("#in-go").disabled = false;
    });
    $("#in-play").onclick = go;
    $("#in-go").onclick = () => { run.intro = false; playSeq.id++; if (player) player.pause(); showQ(); };
    setTimeout(() => { const b = $("#in-go"); if (b) b.disabled = false; }, 20000);   // ovoz chiqmasa ham qotib qolmasin
    go();
  }

  function showQ() {
    if (run.intro) return showIntro();
    const q = run.qs[run.i];
    const prev = run.qs[run.i - 1];
    const banner = run.kind === "exam" && (!prev || prev.skill !== q.skill)
      ? `<div class="section-banner">${EXAM_PLAN.findIndex(p => p[0] === q.skill) + 1}-bo'lim: ${SKILLS[q.skill]}</div>` : "";
    const listenBtn = q.audio ? `<button class="listen ${q.skill === "listening" ? "big-listen" : ""}" data-say aria-label="Tinglash">🔊</button>` : "";
    $("#quiz-in").innerHTML = `
      <div class="quiz-top">
        <button class="x" data-quit aria-label="Chiqish">✕</button>
        <div class="progress"><i style="width:${(run.i / run.qs.length) * 100}%"></i></div>
        ${run.timed ? `<div class="timer" id="timer"><svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" stroke="var(--surface-2)" stroke-width="4" fill="none"/><circle id="ring" cx="22" cy="22" r="19" stroke="var(--brand)" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="${RING}" stroke-dashoffset="0"/></svg><span id="tsec">${TIMER}</span></div>` : ""}
      </div>
      <div class="q-meta">${esc(run.title)} · ${run.i + 1}/${run.qs.length}</div>
      ${banner}
      ${q.passage ? `<details class="passage" ${store.get("dod_passage") === "0" ? "" : "open"}><summary>📖 Matn: <span class="ar">${esc(q.passage.title)}</span></summary>
        <div class="ar passage-text">${q.passage.text.split("\n").map(p => `<p>${esc(p)}</p>`).join("")}</div>
        <button class="btn btn-soft" data-passage>🔊 Matnni tinglash</button></details>` : ""}
      ${q.dialog ? `<div class="dlg-box"><button class="listen big-listen" data-dialog aria-label="Suhbatni tinglash">▶</button>
        <div><b>🎧 Suhbatni tinglang</b><small id="dlg-st">${q.dialog.length} ta gap · istalgancha qayta tinglash mumkin</small></div></div>` : ""}
      <div class="q-card">${q.ins ? `<div class="q-ins"><div class="ar">${q.ins[0]}</div><small>${q.ins[1]}</small></div>` : ""}${q.skill === "listening" && !q.dialog ? listenBtn : ""}${promptHtml(q.text)}${q.skill !== "listening" ? listenBtn : ""}</div>
      ${q.type === "order" || q.type === "spell" ? `${q.type === "spell" ? `<div class="spell-prev ar" id="sprev"></div>` : ""}<div class="slots ar ${q.type}" id="slots"></div><div class="bank ar" id="bank">${q.tiles.map((t, k) => `<button class="wt" data-t="${k}">${esc(t)}</button>`).join("")}</div>
        <button class="btn btn-brand btn-block" id="check" disabled>Tekshirish</button>`
      : q.type === "write" ? writeHtml()
      : q.type === "match" ? `<div class="match"><div class="mcol">${q.left.map(t => `<button class="mt ar" data-side="ar" data-v="${esc(t)}">${esc(t)}</button>`).join("")}</div>
        <div class="mcol">${q.right.map(t => `<button class="mt" data-side="uz" data-v="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>
        <div class="m-stat" id="mstat">⏱ 0 s · ❌ 0</div>`
      : `<div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${"ABCD"[k]}</span><span class="v ${isAr(o) ? "ar" : ""}">${esc(o)}</span></button>`).join("")}</div>`}
      <div id="fb"></div>`;
    $("[data-quit]").onclick = () => (run.kind === "duel" ? toast("⚔️ Duelni oxirigacha o'ynang") : run.i > 0 && run.kind !== "review" ? confirmExit() : closeRun());
    const sb = $("[data-say]"); if (sb) sb.onclick = () => play(q.audio);
    $$(".opt").forEach(b => (b.onclick = () => answer(+b.dataset.k)));
    if (q.type === "order" || q.type === "spell") bindOrder(q);
    if (q.type === "match") bindMatch(q);
    if (q.type === "write") bindWrite(q);
    const pa = $(".passage");
    if (pa) {
      pa.ontoggle = () => store.set("dod_passage", pa.open ? "1" : "0");
      $("[data-passage]").onclick = () => playSeq(q.passage.text.split("\n"));
    }
    if (q.dialog) {
      const st = $("#dlg-st"), btn = $("[data-dialog]");
      const go = () => playSeq(q.dialog, i => {
        if (!$("#dlg-st")) return;
        st.textContent = i < 0 ? "Yana tinglash uchun ▶ ni bosing" : `${i + 1}/${q.dialog.length}-gap…`;
        btn.textContent = i < 0 ? "▶" : "🔊";
      });
      btn.onclick = go;
      if ((!prev || !prev.dialog) && !run.hadIntro) go();   // tinglash ekrani bo'lmagan bo'lsa, birinchi savolda o'zi boshlanadi
    }
    if (q.skill === "listening") play(q.audio);
    run.t0 = Date.now();
    if (run.timed) {
      clearInterval(run.timer);
      run.timer = setInterval(() => {
        const left = Math.max(0, TIMER - (Date.now() - run.t0) / 1000);
        const ring = $("#ring"); if (!ring) return;
        ring.setAttribute("stroke-dashoffset", String(RING * (1 - left / TIMER)));
        ring.setAttribute("stroke", left <= 5 ? "var(--bad)" : "var(--brand)");
        $("#tsec").textContent = Math.ceil(left);
        $("#timer").classList.toggle("low", left <= 5);
        if (left <= 0) answer(-1);
      }, 100);
    }
  }

  function confirmExit() {
    sheet(`<h3>Testdan chiqasizmi?</h3><p>Bu testdagi natija saqlanmaydi.</p>
      <button class="btn btn-danger btn-block" id="exit-yes">Ha, chiqaman</button>
      <button class="btn btn-soft btn-block" data-close>Davom etaman</button>`);
    $("#exit-yes").onclick = () => { closeSheet(); closeRun(); };
  }

  // 🧩 Gap tuzish / ✍️ harflardan so'z: pastdagi bo'lakni bossa — yuqoriga o'tadi, yuqoridagini bossa — qaytadi
  function bindOrder(q) {
    const placed = [], joiner = q.joiner ?? " ";
    const draw = () => {
      $("#slots").innerHTML = placed.length ? placed.map((k, i) => `<button class="wt" data-p="${i}">${esc(q.tiles[k])}</button>`).join("") : `<span class="slots-ph">…</span>`;
      if ($("#sprev")) $("#sprev").textContent = placed.map(k => q.tiles[k]).join("") || " ";
      $$("#bank .wt").forEach(b => (b.classList.toggle("used", placed.includes(+b.dataset.t))));
      $("#check").disabled = placed.length !== q.tiles.length;
      $$("#slots .wt").forEach(b => (b.onclick = () => { if (run.locked === run.i) return; placed.splice(+b.dataset.p, 1); draw(); }));
    };
    $$("#bank .wt").forEach(b => (b.onclick = () => {
      const k = +b.dataset.t;
      if (run.locked === run.i || placed.includes(k)) return;
      placed.push(k); if (q.type === "order") play(q.tiles[k]); draw();
    }));
    $("#check").onclick = () => {
      const ok = placed.map(k => q.tiles[k]).join(joiner) === q.answer.join(joiner);
      $("#check").hidden = true;
      $("#slots").classList.add(ok ? "good" : "bad");
      $$(".wt").forEach(b => (b.disabled = true));
      play(q.type === "spell" ? q.audio : q.answer.join(" "));
      settle(ok, false, q.type === "spell" ? q.audio : q.answer.join(" "));
    };
    draw();
  }

  // ✍️ Yozish: ilova ichidagi arabcha klaviatura (ko'pchilik telefonida arabcha klaviatura yo'q) yoki telefonning o'zinikidan
  const KB_ROWS = ["ضصثقفغعهخحج", "شسيبلاتنمكط", "ذئءؤرىةوزظد", "أإآ"];
  const kbMode = () => store.get("dod_kb") || "app";
  const writeHtml = () => `
    <input class="input ar w-in" id="win" dir="rtl" lang="ar" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="…" ${kbMode() === "app" ? 'inputmode="none"' : ""}>
    ${kbMode() === "app" ? `<div class="akb">${KB_ROWS.map(r => `<div class="akb-row">${Array.from(r).map(c => `<button class="akb-k" data-c="${c}">${c}</button>`).join("")}${r === KB_ROWS[3] ? `<button class="akb-k wide" data-c=" ">bo'sh joy</button><button class="akb-k" data-bs aria-label="O'chirish">⌫</button>` : ""}</div>`).join("")}</div>` : ""}
    <button class="link-btn" id="kb-sw">${kbMode() === "app" ? "📱 Telefon klaviaturasida yozaman" : "⌨️ Ilovadagi arabcha klaviatura"}</button>
    <button class="btn btn-brand btn-block" id="check">Tekshirish</button>`;
  // Taqqoslash: harakatlar va tinish belgilari hisobga olinmaydi; "loose" — hamza/ة/ى farqlarini ham kechiradi
  const strict = s => s.replace(HARAKAT, "").replace(/[؟?!.,،:]/g, "").replace(/\s+/g, " ").trim();
  const loose = s => strict(s).replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
  function bindWrite(q) {
    const inp = $("#win");
    if (!q.text) setTimeout(() => play(q.audio), 300);   // diktant: so'z o'zi eshittiriladi
    $$(".akb-k").forEach(b => (b.onclick = () => {
      if (run.locked === run.i) return;
      inp.value = b.hasAttribute("data-bs") ? Array.from(inp.value).slice(0, -1).join("") : inp.value + b.dataset.c;
    }));
    $("#kb-sw").onclick = () => { store.set("dod_kb", kbMode() === "app" ? "phone" : "app"); const v = inp.value; showQ(); $("#win").value = v; if (kbMode() === "phone") $("#win").focus(); };
    const check = () => {
      if (run.locked === run.i) return;
      const v = inp.value;
      if (!strict(v)) return toast("Avval javobni yozing ✍️");
      const exact = strict(v) === strict(q.answer), ok = exact || loose(v) === loose(q.answer);
      inp.readOnly = true; inp.classList.add(ok ? "good" : "bad");
      $("#check").hidden = true; $("#kb-sw").hidden = true; if ($(".akb")) $(".akb").hidden = true;
      settle(ok, false, q.answer, ok && !exact ? { note: `Deyarli a'lo! To'g'ri yozilishi: ${q.answer} (hamza, ة yoki ى ga e'tibor bering)` } : {});
    };
    $("#check").onclick = check;
    inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); if (run.locked === run.i) $("#next")?.click(); else check(); } };
  }

  // 🔗 Juftini top: chapdan va o'ngdan bittadan tanlanadi; 1 tagacha xato — to'g'ri hisoblanadi
  const MATCH_MAX_ERR = 1, MATCH_FAST = 25;
  function bindMatch(q) {
    let sel = null, errs = 0, done = 0;
    const tick = () => { const st = $("#mstat"); if (st) st.textContent = `⏱ ${Math.floor((Date.now() - run.t0) / 1000)} s · ❌ ${errs}`; };
    clearInterval(run.timer); run.timer = setInterval(tick, 500);
    $$(".mt").forEach(b => (b.onclick = () => {
      if (run.locked === run.i || b.disabled) return;
      if (b.dataset.side === "ar") play(b.dataset.v);
      if (!sel || sel.dataset.side === b.dataset.side) {
        if (sel) sel.classList.remove("sel");
        sel = b; b.classList.add("sel"); return;
      }
      const [a, u] = sel.dataset.side === "ar" ? [sel, b] : [b, sel];
      sel.classList.remove("sel"); sel = null;
      if (q.pairs.some(p => p.ar === a.dataset.v && p.uz === u.dataset.v)) {
        [a, u].forEach(x => { x.classList.add("good"); x.disabled = true; });
        if (++done === q.pairs.length) {
          clearInterval(run.timer); tick();
          const secs = (Date.now() - run.t0) / 1000;
          const ok = errs <= MATCH_MAX_ERR;
          settle(ok, false, "", { fast: ok && secs <= MATCH_FAST, note: `⏱ ${Math.round(secs)} soniya · ${errs ? `❌ ${errs} ta xato` : "xatosiz!"}` });
        }
      } else {
        errs++; tick();
        [a, u].forEach(x => { x.classList.add("bad"); setTimeout(() => x.classList.remove("bad"), 600); });
      }
    }));
  }

  function answer(k) {
    if (!run || run.locked === run.i) return;
    const q = run.qs[run.i];
    $$(".opt").forEach(b => {
      const i = +b.dataset.k; b.disabled = true;
      if (i === q.correct) { b.classList.add("good"); b.querySelector(".k").textContent = "✓"; }
      else if (i === k) { b.classList.add("bad"); b.querySelector(".k").textContent = "✕"; }
    });
    settle(k === q.correct, k === -1, q.options[q.correct]);
  }

  // Javob natijasi: XP, xatolar ro'yxati va pastdagi izoh (barcha savol turlari uchun umumiy)
  function settle(ok, timeout, right, extra = {}) {
    if (!run || run.locked === run.i) return;
    run.locked = run.i;
    clearInterval(run.timer);
    const q = run.qs[run.i];
    const secs = Math.min(TIMER, (Date.now() - run.t0) / 1000);
    run.timeUsed += secs;
    let gain = 0;
    if (ok) { run.right++; gain = XP_OK; if ((run.timed && secs <= FAST) || extra.fast) { gain += XP_FAST; run.fast++; } }
    if (run.noXp) gain = 0;   // Practice box: o'tib ketgan kun mashqi — ballsiz
    if (run.kind !== "duel") run.practice += gain;   // duelda XP faqat natijaga qarab beriladi
    run.answers.push({ s: q.skill, t: q.topic, c: ok });
    const sk = run.bySkill[q.skill] || (run.bySkill[q.skill] = [0, 0]);
    sk[0] += ok ? 1 : 0; sk[1]++;

    // Xatolar ro'yxati, xuddi botdagidek
    if (run.kind === "review") {
      const m = S.mistakes[q.key];
      if (m) {
        if (ok) { m.streak++; if (m.streak >= REVIEW_NEEDED) { delete S.mistakes[q.key]; run.fixed++; bump("fixed"); } }
        else m.streak = 0;
      }
    } else if (!ok) {
      S.mistakes[q.key] = { q: { ...q }, streak: 0 };
    }
    if (ok && q.skill === "listening") bump("listen_ok");

    const shown = run.kind === "duel" || run.noXp ? "" : ` +${gain} XP`;
    const title = ok ? (gain > XP_OK ? `⚡ Chaqmoqdek tez!${shown}` : `✅ To'g'ri!${shown}`) : (timeout ? "⏰ Vaqt tugadi" : "❌ Noto'g'ri");
    const why = q.type === "match" ? `Juftliklarni topdingiz, lekin xato ${MATCH_MAX_ERR} tadan oshdi. Keyingi safar shoshilmang 🙂` : "";
    const gloss = q.gloss ? `<div class="gloss">${q.gloss.map(([a, u]) => `<span${a === right ? ' class="odd"' : ""}><b class="ar">${esc(a)}</b> ${esc(u)}</span>`).join("")}</div>` : "";
    const body = (extra.note ? `<p>${esc(extra.note)}</p>` : "") + (ok ? gloss
      : `<p>${why || `To'g'ri javob: <b class="${isAr(right) ? "ar" : ""}">${esc(right)}</b>`}${q.hint && !gloss ? `<br>💡 <span>${esc(q.hint)}</span>` : ""}</p>${gloss}`);
    const last = run.i + 1 >= run.qs.length;
    $("#fb").innerHTML = `<div class="feedback ${ok ? "good" : "bad"}"><b>${title}</b>${body}</div>
      <button class="btn btn-brand btn-block" id="next" style="margin-top:12px">${last ? "Natijani ko'rish" : "Davom etish →"}</button>`;
    $("#next").onclick = () => { run.i++; last ? finish() : showQ(); };
    $("#next").focus({ preventScroll: true });
    setTimeout(() => $("#fb")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }

  async function finish() {
    const r = run, n = r.qs.length, pct = Math.round(r.right * 100 / n);
    const pills = [], lines = [];
    let headline = pct === 100 ? "Mukammal! 💯" : pct >= PASS ? "Zo'r natija!" : "Yaxshi urinish!";
    let actions = `<button class="btn btn-soft btn-block" data-home>Bosh sahifa</button>`;
    let bonus = 0, flash = false;
    $("#quiz-in").innerHTML = `<div class="result"><div class="q-meta">${esc(r.title)}</div><div class="score">${r.right}/${n}</div><p class="muted">Natija saqlanmoqda…</p></div>`;

    if (r.kind === "duel") return finishDuel(r);

    if (r.kind === "mission") {
      if (r.fast) pills.push(`<span class="pill gold">⚡ ${r.fast} ta tez javob</span>`);
      if (S.lastMission !== today()) {
        S.streak = S.lastMission === yesterday() ? S.streak + 1 : 1;
        S.lastMission = today(); bonus += XP_MISSION;
        pills.push(`<span class="pill gold">🔥 Olov yondi: ${S.streak} kun</span>`, `<span class="pill gold">🎁 +${XP_MISSION} bonus</span>`);
      } else pills.push(`<span class="pill soft">Bugungi missiya avval bajarilgan, bu mashq</span>`);
      flash = r.fast >= 5;
      actions = `<button class="btn btn-brand btn-block" data-again>➕ Yana 5 ta savol</button>` + actions;
    } else if (r.kind === "daily") {
      const { lesson: ln, day: k, part: p, date } = r, wasPassed = passed(ln);
      const best = (((S.days = S.days || {})[ln] = S.days[ln] || {})[k] = S.days[ln][k] || {});
      best[p] = Math.max(best[p] || 0, pct);
      if (date) {
        // Bugungi topshiriq: Daily Tasks'ning 4 qismi bajarilsa — bonus va olov
        const t = ((S.daily = S.daily || {})[date] = S.daily[date] || { n: ln, k, parts: {} });
        t.parts[p] = Math.max(t.parts[p] || 0, pct);
        if (!t.bonus && DAILY.every(([q]) => (t.parts[q] || 0) >= PASS)) {
          t.bonus = true; bonus += XP_MISSION;
          if (S.lastMission !== today()) { S.streak = S.lastMission === yesterday() ? S.streak + 1 : 1; S.lastMission = today(); }
          pills.push(`<span class="pill gold">🔥 Olov: ${S.streak} kun</span>`, `<span class="pill gold">🎁 Daily Tasks bonusi +${XP_MISSION}</span>`);
        }
      } else pills.push(`<span class="pill soft">🧺 Practice box: bu mashq uchun ball berilmaydi</span>`);
      // Unitning barcha kunlari va qismlari 80%+ bo'lsa — unit o'tildi
      const lows = lesson(ln).days.map((_, i) => Math.min(...PARTS.map(([q]) => dayScore(ln, i, q) ?? 0)));
      if (Math.min(...lows) >= PASS) S.lessons[ln] = Math.max(S.lessons[ln] || 0, Math.min(...lows));
      const score = q => (date ? onTime(date, q) : dayScore(ln, k, q)) || 0;
      const nextP = PARTS.find(([q]) => q !== p && score(q) < PASS);
      const go = q => `data-dpart="${q}" data-n="${ln}" data-k="${k}" data-date="${date || ""}"`;
      if (pct >= PASS) {
        headline = nextP ? `✅ ${partLabel(p)} bajarildi!` : date ? "🎉 Bugungi barcha topshiriqlar bajarildi!" : "🎉 Bu kunning barcha mashqlari bajarildi!";
        if (nextP) actions = `<button class="btn btn-brand btn-block" ${go(nextP[0])}>Keyingisi: ${partLabel(nextP[0])} →</button>` + actions;
      } else {
        headline = `${partLabel(p)}: ${PASS}% kerak edi`;
        actions = `<button class="btn btn-brand btn-block" ${go(p)}>🔁 Qayta urinish</button>` + actions;
      }
      if (!wasPassed && passed(ln)) headline = `🎉 ${lname(ln)} to'liq o'tildi!`;
      actions += date ? `<button class="btn btn-soft btn-block" data-gotoday>📅 Bugungi topshiriqlar</button>`
        : `<button class="btn btn-soft btn-block" data-practice>🧺 Practice box</button>`;
    } else if (r.kind === "lesson") {
      const ln = r.lesson, wasPassed = passed(ln);
      S.lessons[ln] = Math.max(S.lessons[ln] || 0, pct);
      if (pct >= PASS) {
        const nx = nextOf(ln);
        if (!nx) headline = "🎉 Barcha darslar tugadi! 👑";
        else if (wasPassed) headline = "Dars yana bir bor mustahkamlandi 💪";
        else if (teacherOpened(nx)) headline = `🎉 ${lname(ln)} o'tildi! ${lname(nx)} ochildi 🔓`;
        else headline = `🎉 ${lname(ln)} o'tildi! ${lname(nx)}ni ustoz darsda o'tgach ochadi 🔔`;
        if (nx && teacherOpened(nx)) actions = `<button class="btn btn-brand btn-block" data-lesson="${nx}">${lname(nx)}ga o'tish →</button>` + actions;
      } else {
        headline = `Keyingi dars uchun ${PASS}% kerak`;
        actions = `<button class="btn btn-brand btn-block" data-lesson="${ln}">🔁 Qayta urinish</button>` + actions;
      }
    } else if (r.kind === "listen") {
      headline = pct >= 70 ? "Qulog'ingiz arabchaga o'rganyapti 🎧" : "Yana tinglang, har safar osonlashadi 💪";
      actions = `<button class="btn btn-brand btn-block" data-again>🎧 Yana tinglash</button>` + actions;
    } else if (r.kind === "review") {
      const left = Object.keys(S.mistakes).length;
      pills.push(`<span class="pill green">🩹 Tuzatildi: ${r.fixed} ta</span>`);
      headline = left ? `Ro'yxatda qoldi: ${left} ta` : "🎉 Xatolar ro'yxati bo'sh!";
      if (left) actions = `<button class="btn btn-brand btn-block" data-again>🔁 Yana takrorlash</button>` + actions;
    } else if (r.kind === "exam") {
      S.examBest = Math.max(S.examBest || 0, pct);
      for (const [sk] of EXAM_PLAN) {
        const [c, t] = r.bySkill[sk] || [0, 0];
        if (t) lines.push(`<div><span>${SKILLS[sk]}</span><b>${c}/${t} · ${Math.round(c * 100 / t)}%</b></div>`);
      }
      if (pct >= PASS) { bonus += XP_EXAM; headline = "✅ Pre-A1 darajasi: o'tdingiz!"; pills.push(`<span class="pill gold">🎁 +${XP_EXAM} bonus</span>`); }
      else headline = `Hozircha ${PASS}% ga yetmadi. Yana tayyorlanib, qayta urinib ko'ring 💪`;
    }

    const newBadges = checkBadges(flash);
    const res = await saveResult(r.practice, bonus, r.kind, r.answers);
    const earned = (res.granted || 0) + (res.bonus || 0);
    if (r.kind === "lesson" && pct >= PASS && !res.offline) refClaim();
    if (res.capped) pills.push(`<span class="pill soft">🎯 Bugungi ${DAILY_CAP} XP chegarasi to'ldi, mashq davom etsin 💪</span>`);
    if (res.offline) pills.push(`<span class="pill soft">📶 Internet yo'q, natija keyin yuboriladi</span>`);
    if (r.kind !== "review" && r.right < n && Object.keys(S.mistakes).length) pills.push(`<span class="pill soft">❌ Xatolar «Xatolarim» bo'limiga tushdi</span>`);

    if (!run || run !== r) return;
    $("#quiz-in").innerHTML = `
      <div class="result">
        <div class="q-meta">${esc(r.title)}</div>
        <div class="score">${r.right}/${n}</div>
        <div style="font-family:var(--f-display);font-weight:600;font-size:17px;text-wrap:balance">${headline}</div>
        <div class="gain"><span class="pill green">⭐ +${earned} XP</span>${pills.join("")}</div>
        ${lines.length ? `<div class="lines">${lines.join("")}</div>` : ""}
        ${newBadges.map(b => `<div class="new-badge">🏅 Yangi nishon: ${b[1]} ${esc(b[2])}</div>`).join("")}
        <div class="actions">${actions}</div>
      </div>`;
    bindResultButtons(r.kind);
  }

  function bindResultButtons(kind) {
    $("[data-home]").onclick = closeRun;
    const again = $("[data-again]"); if (again) again.onclick = () => ({ mission: startMission, listen: startListen, review: startReview })[kind]();
    const nextL = $("[data-lesson]"); if (nextL) nextL.onclick = () => startLesson(+nextL.dataset.lesson);
    const dp = $("[data-dpart]"); if (dp) dp.onclick = () => startDaily(+dp.dataset.n, +dp.dataset.k, dp.dataset.dpart, dp.dataset.date || null);
    const gt = $("[data-gotoday]"); if (gt) gt.onclick = () => { closeRun(); showTab("today"); };
    const pb = $("[data-practice]"); if (pb) pb.onclick = () => { closeRun(); practiceSheet(); };
  }

  // ---------- Do'stni taklif qilish ----------
  let REF = {};
  const REF_BONUS = 100;
  const refLink = () => `${location.origin}${location.pathname}?ref=${REF.code}`;
  async function loadRef() {
    try { REF = await rpc("ref_info", { p_token: TOKEN }); } catch { return; }
    $("#p-ref-stat").textContent = REF.invited || REF.pending
      ? `✅ ${REF.invited} ta do'st qo'shildi${REF.pending ? ` · ⏳ ${REF.pending} ta birinchi darsini kutmoqda` : ""}`
      : `Do'stingiz birinchi darsini o'tsa, ikkalangizga +${REF_BONUS} XP`;
    if (checkBadges().length) saveResult(0, 0, "badge", []);
  }
  async function refClaim() {
    try {
      const r = await rpc("ref_claim", { p_token: TOKEN });
      if (r.ok) { ME.xp += REF_BONUS; render(); toast(`🎁 ${r.inviter} sizni taklif qilgan edi: ikkalangizga +${REF_BONUS} XP!`); }
    } catch { /* keyingi safar */ }
  }
  function shareInvite() {
    if (!REF.code) return toast(ERRORS.NET);
    const text = `Men Dod ilovasida arab tilini o'yin orqali o'rganyapman 🔥 Qo'shil, birga o'rganamiz! Birinchi darsni o'tsang, ikkalamizga +${REF_BONUS} XP 🎁`;
    const url = refLink();
    const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    sheet(`<h3>🎁 Do'stni taklif qilish</h3>
      <p>Havolani do'stingizga yuboring. U ro'yxatdan o'tib, <b style="color:var(--ink)">birinchi darsini 80% bilan</b> o'tsa, ikkalangizga <b style="color:var(--ink)">+${REF_BONUS} XP</b>. 3 ta do'st olib kelsangiz, 🤝 «Elchi» nishoni.</p>
      <div class="card" style="padding:10px 14px;word-break:break-all;font-size:13.5px">${esc(url)}</div>
      <a class="btn btn-brand btn-block" href="${tg}" target="_blank" rel="noopener">✈️ Telegram orqali yuborish</a>
      <button class="btn btn-soft btn-block" id="ref-copy">📋 Havolani nusxalash</button>
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $("#ref-copy").onclick = async () => {
      try { await navigator.clipboard.writeText(`${text}\n${url}`); toast("📋 Nusxalandi, endi do'stingizga yuboring"); }
      catch { toast("Havolani bosib turib nusxalang"); }
    };
  }

  // ---------- Nishonlar ----------
  function checkBadges(flash = false) {
    const have = new Set(S.badges);
    const got = {
      first: !!S.lastMission, fire7: S.streak >= 7, fire30: S.streak >= 30, flash,
      perfect: Object.values(S.lessons).some(v => v === 100),
      lessons3: Object.values(S.lessons).filter(v => v >= PASS).length >= 3,
      duel1: (S.c.duel_win || 0) >= 1,
      ear50: (S.c.listen_ok || 0) >= 50, fixer20: (S.c.fixed || 0) >= 20, wotd10: (S.c.wotd_ok || 0) >= 10,
      exam: (S.examBest || 0) >= PASS, xp1000: (ME ? ME.xp : 0) >= 1000,
      elchi: (REF.invited || 0) >= 3,
    };
    const fresh = BADGES.filter(b => got[b[0]] && !have.has(b[0]));
    fresh.forEach(b => S.badges.push(b[0]));
    return fresh;
  }

  // ---------- Boshlash tugmalari ----------
  const startMission = () => startRun("mission", build(groupLessons(), 5));
  const startListen = () => startRun("listen", build(groupLessons(), 8, ["listening"]));
  function startReview() {
    const all = shuffle(Object.values(S.mistakes)).slice(0, 10).map(m => reshuffle(m.q));
    if (!all.length) return toast("🎉 Xatolar ro'yxatingiz bo'sh!");
    startRun("review", all);
  }
  function startLesson(n) {
    if (!teacherOpened(n)) return toast("🔒 Bu darsni ustoz hali ochmagan");
    if (!isOpen(n)) return toast(`🔒 Avval ${lname(prevOf(n))}dan ${PASS}% oling`);
    if (hasParts(n)) return unitSheet(n);
    startRun("lesson", build([lesson(n)], n > 100 ? 15 : 10, undefined, true), { lesson: n, title: lname(n) });
  }
  function startExam() {
    if (!ME.group.exam_open) return toast("🎓 Imtihonni ustoz hali ochmagan");
    sheet(`<h3>🎓 CEFR sinov imtihoni</h3>
      <p>Ochiq darslar bo'yicha 20 ta savol: 📖 o'qish (8), ✏️ grammatika (6), 🎧 tinglash (6). O'tish uchun ${PASS}% kerak.</p>
      <button class="btn btn-brand btn-block" id="exam-go">Boshlash</button><button class="btn btn-soft btn-block" data-close>Keyinroq</button>`);
    $("#exam-go").onclick = () => { closeSheet(); startRun("exam", buildExam(groupLessons())); };
  }

  // ---------- Duel ----------
  let INBOX = { incoming: [], waiting: [], results: [] };
  async function loadInbox() {
    try {
      INBOX = await rpc("duel_inbox", { p_token: TOKEN });
      const n = INBOX.incoming.length;
      $("#duel-count").hidden = !n; $("#duel-count").textContent = n;
      // Yangi g'alabalarni hisoblash (nishon uchun)
      const wins = INBOX.results.filter(r => r.outcome === "win").map(r => r.id);
      const seen = new Set(S.c.duel_seen || []);
      const newWins = wins.filter(id => !seen.has(id));
      if (newWins.length) {
        S.c.duel_win = (S.c.duel_win || 0) + newWins.length;
        S.c.duel_seen = [...seen, ...newWins].slice(-50);
        checkBadges();
      }
    } catch { /* internet bo'lmasa, keyinroq */ }
  }

  function duelSheet() {
    const inc = INBOX.incoming.map(d => `
      <div class="duel-item"><span class="ava">${esc(d.from[0])}</span>
        <span class="t"><b>${esc(d.from)}</b><small>sizni duelga chaqirdi</small></span>
        <button class="btn btn-danger" data-decline="${d.id}" aria-label="Rad etish">✕</button>
        <button class="btn btn-brand" data-play="${d.id}">O'ynash</button></div>`).join("");
    const wait = INBOX.waiting.map(d => `
      <div class="duel-item"><span class="ava">${esc(d.vs[0])}</span>
        <span class="t"><b>${esc(d.vs)}</b><small>${d.played ? "siz o'ynadingiz, raqib kutilmoqda ⏳" : "hali o'ynamadingiz"}</small></span>
        ${d.played ? "" : `<button class="btn btn-brand" data-play="${d.id}">O'ynash</button>`}</div>`).join("");
    const res = INBOX.results.slice(0, 5).map(d => `
      <div class="duel-item"><span class="ava">${esc(d.vs[0])}</span>
        <span class="t"><b>${esc(d.vs)}</b><small>${d.my} : ${d.their}</small></span>
        <span class="tag ${d.outcome}">${{ win: "🏆 G'alaba", lose: "Mag'lubiyat", draw: "🤝 Durang" }[d.outcome]}</span></div>`).join("");
    sheet(`<h3>⚔️ Duel</h3>
      <p>${DUEL_QUESTIONS} ta savol, har biriga ${TIMER} soniya. Ikkalangizga bir xil savollar. Ko'p topgan yutadi, teng bo'lsa tezrog'i. G'olibga +30 XP.</p>
      <button class="btn btn-brand btn-block" id="duel-new">➕ Yangi duel: raqib tanlash</button>
      ${inc ? `<h3 style="font-size:15px;margin-top:6px">📨 Sizga takliflar</h3><div>${inc}</div>` : ""}
      ${wait ? `<h3 style="font-size:15px;margin-top:6px">⏳ Siz chaqirganlar</h3><div>${wait}</div>` : ""}
      ${res ? `<h3 style="font-size:15px;margin-top:6px">📜 So'nggi natijalar</h3><div>${res}</div>` : ""}
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $("#duel-new").onclick = pickOpponent;
    $$("[data-play]").forEach(b => (b.onclick = () => playDuel(+b.dataset.play)));
    $$("[data-decline]").forEach(b => (b.onclick = async () => {
      try { await rpc("duel_decline", { p_token: TOKEN, p_id: +b.dataset.decline }); } catch { /* */ }
      await loadInbox(); duelSheet();
    }));
  }

  async function pickOpponent() {
    let mates = [];
    try { mates = await rpc("classmates", { p_token: TOKEN }); } catch (e) { return toast(errText(e)); }
    if (!mates.length) return toast("Guruhda hali boshqa o'quvchi yo'q");
    sheet(`<h3>⚔️ Kimni chaqiramiz?</h3>
      <button class="btn btn-danger btn-block" data-opp="${esc(pick(mates).id)}">🎲 Tasodifiy raqib</button>
      <div>${mates.map(m => `<div class="duel-item"><span class="ava">${esc(m.name[0])}</span><span class="t"><b>${esc(m.name)}</b></span>
        <button class="btn btn-soft" data-opp="${esc(m.id)}">Chaqirish</button></div>`).join("")}</div>
      <button class="btn btn-soft btn-block" data-close>Bekor qilish</button>`);
    $$("[data-opp]").forEach(b => (b.onclick = async () => {
      const lessons = groupLessons().slice(-DUEL_LAST_LESSONS);
      const qs = build(lessons, DUEL_QUESTIONS);
      try {
        const d = await rpc("duel_create", { p_token: TOKEN, p_opponent: b.dataset.opp, p_questions: qs });
        closeSheet();
        toast("📨 Taklif yuborildi! Endi siz o'ynaysiz");
        startRun("duel", d.questions, { duelId: d.id });
      } catch (e) { toast(e.message === "TOO_MANY_DUELS" ? "Javobsiz takliflaringiz ko'p. Avval ular tugasin." : errText(e)); }
    }));
  }

  async function playDuel(id) {
    try {
      const qs = await rpc("duel_questions", { p_token: TOKEN, p_id: id });
      closeSheet();
      startRun("duel", qs, { duelId: id });
    } catch (e) { toast(e.message === "DUEL_GONE" ? "Bu duel endi mavjud emas" : errText(e)); await loadInbox(); }
  }

  async function finishDuel(r) {
    let res;
    try { res = await rpc("duel_submit", { p_token: TOKEN, p_id: r.duelId, p_score: r.right, p_time: Math.round(r.timeUsed * 10) / 10 }); }
    catch (e) { res = { status: "error", msg: errText(e) }; }
    await saveResult(0, 0, "duel", r.answers);   // javoblar statistikasi va xatolar uchun
    await loadInbox();
    if (!run || run !== r) return;
    let head, pill = "";
    if (res.status === "done") {
      head = { win: "🎉 Siz yutdingiz!", lose: "😤 Bu safar yutqazdingiz. Revansh?", draw: "🤝 Durang! Kuchlar teng." }[res.outcome];
      pill = `<span class="pill green">⭐ +${{ win: 30, draw: 15, lose: 5 }[res.outcome]} XP</span>`;
    } else if (res.status === "waiting") head = "Siz tugatdingiz! Raqib o'ynagach natija chiqadi ⏳";
    else head = res.msg;
    $("#quiz-in").innerHTML = `
      <div class="result">
        <div class="q-meta">⚔️ Duel</div>
        <div class="score">${res.status === "done" ? `${res.my} : ${res.their}` : `${r.right}/${r.qs.length}`}</div>
        <div style="font-family:var(--f-display);font-weight:600;font-size:17px;text-wrap:balance">${head}</div>
        <div class="gain">${pill}</div>
        <div class="actions"><button class="btn btn-brand btn-block" id="duel-again">⚔️ Duellar</button>
          <button class="btn btn-soft btn-block" data-home>Bosh sahifa</button></div>
      </div>`;
    $("[data-home]").onclick = closeRun;
    $("#duel-again").onclick = () => { closeRun(); duelSheet(); };
  }

  // ---------- Pastdan chiquvchi oyna ----------
  function sheet(html) {
    $("#sheet-root").innerHTML = `<div class="sheet-wrap" id="sw"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
    $("#sw").addEventListener("click", e => { if (e.target.id === "sw" || e.target.closest("[data-close]")) closeSheet(); });
  }
  const closeSheet = () => { dropRecording(); $("#sheet-root").innerHTML = ""; };

  // ---------- Gapirish: ovoz yozib ustozga yuborish ----------
  const REC_MAX = 90;   // soniya
  let rec = null;       // { stream, mr, chunks, t0, timer, blob, url, mime, seconds }
  function stopRecording() {
    if (!rec) return;
    clearInterval(rec.timer);
    try { if (rec.mr && rec.mr.state !== "inactive") rec.mr.stop(); } catch { /* */ }
    try { rec.stream && rec.stream.getTracks().forEach(t => t.stop()); } catch { /* */ }
  }
  function dropRecording() {
    stopRecording();
    if (rec && rec.url) URL.revokeObjectURL(rec.url);
    rec = null;
  }
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const seenSpeak = () => { try { return JSON.parse(store.get("dod_speak_seen") || "[]"); } catch { return []; } };

  async function loadSpeakBadge() {
    try {
      const mine = await rpc("speaking_mine", { p_token: TOKEN });
      const seen = new Set(seenSpeak());
      const fresh = mine.filter(x => x.score && !seen.has(x.id)).length;
      $("#speak-count").hidden = !fresh; $("#speak-count").textContent = fresh;
      if (mine.filter(x => x.score).length >= 10 && !S.badges.includes("speak10")) S.badges.push("speak10");
      return mine;
    } catch { return null; }
  }

  function speakSheet(prev) {
    dropRecording();
    const topics = D.speaking.filter(t => teacherOpened(t.lesson));
    const others = topics.filter(x => x.title !== prev);
    const t = pick(others.length ? others : topics);
    sheet(`<h3>🎤 Gapirish mashqi</h3>
      <p>Mavzu: <b style="color:var(--ink)">${esc(t.title)}</b><br>${esc(t.task)}</p>
      <div class="q-card"><div class="ar" style="font-size:22px;font-weight:700;line-height:1.9">${esc(t.example)}</div>
        <button class="listen" id="sp-play" aria-label="Namunani tinglash">🔊</button></div>
      <div class="rec" id="rec"></div>
      <button class="btn btn-soft btn-block" id="sp-next">🔄 Boshqa mavzu</button>
      <h3 style="font-size:15px;margin-top:4px">📝 Mening javoblarim</h3>
      <div id="sp-mine" style="display:grid;gap:6px"><p class="muted">Yuklanmoqda…</p></div>
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $("#sp-play").onclick = () => play(t.example);
    $("#sp-next").onclick = () => speakSheet(t.title);
    recStage("idle", t);
    loadSpeakBadge().then(mine => {
      const box = $("#sp-mine"); if (!box) return;
      if (!mine) { box.innerHTML = `<p class="muted">${ERRORS.NET}</p>`; return; }
      box.innerHTML = mine.length ? mine.map(x => `<div class="sp-item"><b>${esc(x.topic)}</b>
        <small>${x.score ? `${"⭐".repeat(x.score)}${"☆".repeat(5 - x.score)} · +${x.score * 6} XP` : "⏳ Ustoz hali baholamagan"}</small>
        ${x.comment ? `<span>💬 ${esc(x.comment)}</span>` : ""}</div>`).join("")
        : `<p class="muted">Hali javob yubormadingiz. Birinchisini yozing! 🎙</p>`;
      const graded = mine.filter(x => x.score).map(x => x.id);
      store.set("dod_speak_seen", JSON.stringify([...new Set([...seenSpeak(), ...graded])].slice(-100)));
      $("#speak-count").hidden = true;
    });
  }

  function recStage(stage, t) {
    const box = $("#rec"); if (!box) return;
    if (stage === "idle") {
      box.innerHTML = `<button class="rec-btn" id="rec-start" aria-label="Yozishni boshlash">🎙</button>
        <small class="muted">Bosing va arabcha gapiring (${REC_MAX} soniyagacha)</small>`;
      $("#rec-start").onclick = () => startRecording(t);
    } else if (stage === "recording") {
      box.innerHTML = `<div class="rec-time"><span class="rec-live"></span><span id="rec-sec">0:00</span></div>
        <button class="rec-btn stop" id="rec-stop" aria-label="To'xtatish">⏹</button><small class="muted">Tugatgach to'xtatish tugmasini bosing</small>`;
      $("#rec-stop").onclick = () => stopRecording();
    } else if (stage === "done") {
      box.innerHTML = `<small class="muted">Yozganingizni eshitib ko'ring (${fmt(rec.seconds)})</small><audio controls src="${rec.url}"></audio>
        <div class="rec-actions"><button class="btn btn-soft" id="rec-again">🔄 Qayta yozish</button><button class="btn btn-brand" id="rec-send">📤 Yuborish</button></div>`;
      $("#rec-again").onclick = () => { dropRecording(); recStage("idle", t); };
      $("#rec-send").onclick = () => sendRecording(t);
    } else if (stage === "sent") {
      box.innerHTML = `<div style="font-size:34px">✅</div><b>Ustozga yuborildi!</b><small class="muted">Baho va izoh shu yerda, «Mening javoblarim»da ko'rinadi</small>`;
    }
  }

  async function startRecording(t) {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      return toast(inTelegram ? "Telegram ichida ovoz yozib bo'lmaydi. Ilovani Chrome yoki Safari'da oching" : "Bu brauzerda ovoz yozib bo'lmaydi. Chrome yoki Safari'da oching");
    }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { return toast("🎙 Mikrofonga ruxsat bering: brauzer so'raganda «Разрешить» ni bosing"); }
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
    let mr;
    try { mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined); }
    catch { mr = new MediaRecorder(stream); }
    rec = { stream, mr, chunks: [], t0: Date.now(), mime: mr.mimeType || mime || "audio/webm" };
    mr.ondataavailable = e => { if (e.data && e.data.size) rec.chunks.push(e.data); };
    mr.onstop = () => {
      if (!rec) return;
      rec.seconds = (Date.now() - rec.t0) / 1000;
      rec.blob = new Blob(rec.chunks, { type: rec.mime });
      rec.url = URL.createObjectURL(rec.blob);
      try { rec.stream.getTracks().forEach(tr => tr.stop()); } catch { /* */ }
      if (rec.seconds < 2) { dropRecording(); recStage("idle", t); return toast("Juda qisqa. Kamida bir necha soniya gapiring"); }
      recStage("done", t);
    };
    mr.start(1000);
    recStage("recording", t);
    rec.timer = setInterval(() => {
      const s = (Date.now() - rec.t0) / 1000;
      const el = $("#rec-sec"); if (el) el.textContent = fmt(s);
      if (s >= REC_MAX) stopRecording();
    }, 250);
  }

  async function sendRecording(t) {
    if (!rec || !rec.blob) return;
    $("#rec-send").disabled = true; $("#rec-send").textContent = "Yuborilmoqda…";
    const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1] || ""); fr.readAsDataURL(rec.blob); });
    try {
      await rpc("speaking_submit", { p_token: TOKEN, p_topic: t.title, p_mime: rec.mime.slice(0, 60), p_audio_b64: b64, p_seconds: Math.round(rec.seconds) });
      dropRecording();
      recStage("sent", t);
    } catch (e) {
      $("#rec-send").disabled = false; $("#rec-send").textContent = "📤 Yuborish";
      toast({ SPEAK_LIMIT: "Bugun 3 ta javob yubordingiz. Ertaga davom etamiz! 💪", AUDIO_TOO_BIG: "Yozuv juda uzun. Qisqaroq qilib qayta yozing" }[e.message] || errText(e));
    }
  }

  // ---------- Ekranlar ----------
  function render() {
    if (!ME) return;
    const st = streakNow();
    $("#h-name").textContent = ME.name;
    $("#h-streak").textContent = st; $("#chip-fire").classList.toggle("off", !st);
    $("#h-xp").textContent = ME.xp;

    const doneToday = S.lastMission === today();
    $("#m-title").textContent = doneToday ? "Bugungi missiya bajarildi ✅" : "5 ta savol, 15 soniyadan";
    $("#m-sub").textContent = doneToday ? "Ertaga yana keling. Hozir qo'shimcha mashq qilsangiz ham bo'ladi."
      : st ? `Bajarsangiz, olov ${st + 1}-kunga yonadi. Tez javob uchun ⚡ bonus.` : "Bajaring va olovni yoqing 🔥 Tez javob uchun ⚡ bonus.";
    $("#m-start").textContent = doneToday ? "Mashq qilish →" : "Boshlash →";
    $$("#m-dots i").forEach(i => i.classList.toggle("on", doneToday));

    const next = RANKS.find(r => r[0] > ME.xp), cur = RANKS.filter(r => ME.xp >= r[0]).pop();
    const todayXp = Math.min(DAILY_CAP, ME.practice_today || 0);
    $("#rankline").innerHTML = (next
      ? `<div class="l"><b>${cur[1]}</b><span>${next[0] - ME.xp} XP → ${next[1]}</span></div><div class="bar"><i style="width:${Math.round((ME.xp - cur[0]) * 100 / (next[0] - cur[0]))}%"></i></div>`
      : `<div class="l"><b>${cur[1]}</b><span>Eng yuqori unvon 👑</span></div><div class="bar"><i style="width:100%"></i></div>`)
      + `<div class="l" style="margin-top:6px"><span>🎯 Bugungi mashq XP</span><b>${todayXp}/${DAILY_CAP}</b></div><div class="bar"><i style="width:${Math.round(todayXp * 100 / DAILY_CAP)}%;background:var(--brand)"></i></div>`;

    const mc = Object.keys(S.mistakes).length;
    $("#mist-count").hidden = !mc; $("#mist-count").textContent = mc;

    renderWotd(); renderLessons(); renderWords(); renderProfile(); renderToday();
  }
  const showTab = name => $(`.tab[data-tab="${name}"]`).click();

  // Kun so'zi: har kuni hamma uchun bitta so'z (sana bo'yicha tanlanadi)
  function seeded(seed) { let x = 0; for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296); }
  function renderWotd() {
    const words = groupLessons().flatMap(l => l.words);
    const r = seeded(today());
    const w = words[Math.floor(r() * words.length)];
    const pool = [...new Set(sameKind(w, words).map(x => x.uz).filter(u => u !== w.uz))];
    const others = []; while (others.length < 3 && pool.length) others.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    const opts = [...others, w.uz].sort(() => r() - .5);
    const done = S.wotd.day === today();
    $("#wotd-note").textContent = done ? (S.wotd.ok ? "✅ Topdingiz" : "Ertaga yangi so'z") : `+${XP_WOTD} XP`;
    $("#wotd").innerHTML = `
      <div class="wotd-head"><span class="q-meta">${done ? "Bugungi so'z" : "Ma'nosini bilasizmi?"}</span><button class="listen" id="wotd-play" aria-label="Tinglash">🔊</button></div>
      <div class="wotd-word ar">${esc(w.ar)}</div>
      ${done ? `<p style="text-align:center;margin:0;font-weight:700">${esc(cap(w.uz))}</p>`
        : `<div class="grid2">${opts.map(o => `<button class="opt-sm" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`}`;
    $("#wotd-play").onclick = () => play(w.ar);
    $$("#wotd .opt-sm").forEach(b => (b.onclick = async () => {
      const ok = b.dataset.o === w.uz;
      $$("#wotd .opt-sm").forEach(x => { x.disabled = true; if (x.dataset.o === w.uz) x.classList.add("good"); else if (x === b) x.classList.add("bad"); });
      S.wotd = { day: today(), ok };
      if (ok) bump("wotd_ok");
      const fresh = checkBadges();
      await saveResult(0, ok ? XP_WOTD : 0, "wotd", [{ s: "reading", t: w.ar, c: ok }]);
      toast(ok ? `✅ To'g'ri! ${w.ar} = ${w.uz} · +${XP_WOTD} XP` : `❌ ${w.ar} = ${w.uz}. Ertaga albatta topasiz!`);
      if (fresh.length) setTimeout(() => toast(`🏅 Yangi nishon: ${fresh[0][1]} ${fresh[0][2]}`), 3100);
      setTimeout(render, 1400);
    }));
  }

  // Darajalar xaritasi: hozircha faqat Pre-A1 tayyor, qolganlari "Tez orada"
  const LEVELS = [
    // Nomlar kitobdagidek arabcha (المنهج العالمي darajalari)
    ["Pre-A1", "التَّمْهِيدِيُّ", "Alifbo va ilk so'zlar"],
    ["A1", "الْمُبْتَدِئُ الْأَوَّلُ", "Oddiy suhbat, kundalik so'zlar"],
    ["A2", "الْمُبْتَدِئُ الثَّانِي", "O'zim, oilam, shahrim haqida"],
    ["B1", "الْمُتَوَسِّطُ الْأَوَّلُ", "اَلتَّعْبِيرُ عَنِ الرَّأْيِ"],
    ["B2", "الْمُتَوَسِّطُ الثَّانِي", "اَلنِّقَاشُ وَقِرَاءَةُ الْمَقَالَاتِ"],
    ["C1", "الْمُتَقَدِّمُ الْأَوَّلُ", "اَلطَّلَاقَةُ فِي الْكَلَامِ"],
    ["C2", "الْمُتَقَدِّمُ الثَّانِي", "مُسْتَوَى الْإِتْقَانِ"],
  ];
  // Xarita: daraja nishoni → darslar doirachalari (ilon izi) → imtihon → keyingi daraja
  function renderLessons() {
    const WAVE = [50, 68, 78, 68, 50, 32, 22, 32];
    const levelLessons = code => D.lessons.filter(l => (l.level || "Pre-A1") === code);
    const items = []; let y = 60, w = 0;
    LEVELS.forEach(([code, name, sub], li) => {
      const ls = levelLessons(code), ready = ls.length > 0;
      const done = ls.filter(l => passed(l.number)).length;
      if (li) y += 40;
      const here = ls.some(l => isOpen(l.number) || passed(l.number));   // talaba shu darajaga yetib kelganmi
      items.push({ kind: "level", li, code, name, sub, ready, here, done, total: ls.length, x: 50, y }); y += ready ? 205 : 150;
      if (!ready) return;
      ls.forEach(l => { items.push({ kind: "lesson", n: l.number, title: l.title, x: WAVE[w++ % WAVE.length], y }); y += 96; });
      if (li === 0) { items.push({ kind: "exam", x: 50, y: y + 6 }); y += 120; }
    });
    const h = y;
    // Yo'l chizig'i: o'tilgan qismi oltin rangda yonadi
    const lit = it => it.kind === "lesson" ? passed(it.n) : it.kind === "level" ? it.ready : false;
    const seg = (a, b) => `<path vector-effect="non-scaling-stroke" class="${lit(a) && (lit(b) || b.kind === "lesson" && isOpen(b.n)) ? "done" : ""}" d="M${a.x} ${a.y} C${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}"/>`;
    const node = it => {
      const pos = `style="left:${it.x}%;top:${it.y}px"`;
      if (it.kind === "level") {
        const done = it.ready && it.done === it.total, cls = done ? "done" : it.ready && it.here ? "current" : "soon";
        return `<button class="lv ${cls}" data-lv="${it.li}" ${pos}>
          <span class="lv-node" style="--p:${it.ready ? Math.round(it.done * 100 / it.total) : 0}">${done ? "✓" : it.code}</span>
          <span class="lv-label"><b class="ar">${it.name}</b><small class="s">${it.code} · ${it.ready ? `${it.done}/${it.total} ${it.li ? "bo'lim" : "dars"}` : "🔒 Tez orada"}</small></span></button>`;
      }
      if (it.kind === "exam") {
        const cls = (S.examBest || 0) >= PASS ? "done" : ME.group.exam_open ? "open" : "locked";
        return `<button class="ln exam ${cls}" data-exam ${pos} aria-label="CEFR sinov imtihoni"><span class="ln-dot">🎓</span><span class="ln-lab">Imtihon${S.examBest ? ` · ${S.examBest}%` : ""}</span></button>`;
      }
      const n = it.n, cls = passed(n) ? "done" : isOpen(n) ? "current" : "locked";
      const side = it.x > 50 ? "left" : "right";
      return `<button class="ln ${cls}" data-n="${n}" ${pos} aria-label="${lname(n)}">
        ${cls === "current" ? `<span class="lv-here">Boshlash</span>` : ""}
        <span class="ln-dot">${cls === "done" ? "✓" : n > 100 ? n - 100 : n}</span><span class="ln-lab ${side} ar ${n > 100 ? "long" : ""}">${esc(it.title)}</span></button>`;
    };
    const box = $("#lvmap");
    box.style.height = h + "px";
    box.innerHTML = `<svg viewBox="0 0 100 ${h}" preserveAspectRatio="none" aria-hidden="true">${items.slice(1).map((b, i) => seg(items[i], b)).join("")}</svg>`
      + items.map(node).join("");
    $$(".lv").forEach(b => (b.onclick = () => {
      const it = items.find(x => x.kind === "level" && x.li === +b.dataset.lv);
      toast(!it.ready ? `🔒 ${it.code} darajasi tez orada ochiladi` : it.here ? `${it.code}: ${it.done}/${it.total} o'tildi` : `🔒 ${it.code} oldingi daraja tugagach ochiladi`);
    }));
    $$(".ln[data-n]").forEach(b => (b.onclick = () => lessonSheet(+b.dataset.n)));
    $("[data-exam]").onclick = startExam;
  }
  // ---------- 📅 Bugun: kunlik topshiriqlar jadvali ----------
  // Jadval o'quvchi «Bugun»ni birinchi ochgan kundan boshlanadi (S.dstart); yakshanba — dam olish.
  // Topshiriq faqat o'sha kuni ball beradi; o'tgan kunlarnikini Practice box'da ballsiz ishlash mumkin.
  const dow = d => new Date(d + "T00:00:00Z").getUTCDay();   // 0 — yakshanba
  const WEEK = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
  const unitName = n => `A1 ${n - 100}-unit`;
  function taskFor(date) {
    if (!S.dstart || date < S.dstart) return { none: true };
    if (dow(date) === 0) return { rest: true };
    let i = 0;
    for (let d = S.dstart; d < date; d = addDays(d, 1)) if (dow(d) !== 0) i++;
    for (const u of D.lessons.filter(l => l.level === "A1")) {
      if (!u.days) return { soon: true, n: u.number };
      if (i < u.days.length) return teacherOpened(u.number) ? { n: u.number, k: i } : { locked: true, n: u.number };
      i -= u.days.length;
    }
    return { soon: true };
  }
  // Shu unit kuniga qaysi sana to'g'ri keladi (yo'q bo'lsa null)
  function dateOf(n, k) {
    if (!S.dstart) return null;
    for (let d = S.dstart, t = 0; t < 400; d = addDays(d, 1), t++) {
      const x = taskFor(d);
      if (x.n === n && x.k === k) return d;
      if (x.soon || (x.n && x.n > n)) return null;
    }
    return null;
  }
  const fmtDate = d => { const [, m, dd] = d.split("-"); return `${+dd}.${m}`; };
  const dayDoneOnTime = date => PARTS.filter(([p]) => (onTime(date, p) || 0) >= PASS).length;

  function startDaily(n, k, p, date) {
    const live = !!date && date === today();
    startRun("daily", PART_BUILD[p](dayData(n, k)), { lesson: n, day: k, part: p, date: live ? date : null, noXp: !live,
      intro: p === "listening", hadIntro: p === "listening",
      title: `${unitName(n)} · ${k + 1}-kun · ${partLabel(p)}${live ? "" : " (mashq)"}` });
  }

  let todaySel = null;
  function renderToday() {
    const box = $("#today-box"); if (!box || !ME) return;
    if (!DAILY_ON) {
      box.innerHTML = `<div class="card t-soon"><div class="ar">قَرِيبًا</div><b>Tez orada</b>
        <p class="muted">Har kunlik topshiriqlar: ✏️ grammatika, 📚 lug'at, 🎧 tinglash, 📖 o'qish va ✍️ yozish. Hozircha darslarni «Darslar» bo'limida o'ting.</p>
        <button class="btn btn-brand btn-block" id="t-lessons">📚 Darslarga o'tish</button></div>`;
      $("#t-lessons").onclick = () => showTab("lessons");
      return;
    }
    const td = today(), sel = todaySel || td;
    const mon = addDays(td, -((dow(td) + 6) % 7));
    const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    const status = d => {
      const t = taskFor(d);
      if (t.rest) return "rest";
      if (!t.n || t.locked) return "none";
      if (d > td) return "future";
      const got = dayDoneOnTime(d);
      return got === PARTS.length ? "done" : got ? "part" : d === td ? "todo" : "missed";
    };
    const t = taskFor(sel);
    let body;
    if (t.none && !S.dstart) body = openCount("A1") > 0
      ? `<div class="card t-start"><h3>📅 A1 kunlik dasturi</h3><p>Har kuni yangi topshiriqlar: ✏️ grammatika, 📚 lug'at, 🎧 tinglash, 📖 o'qish va ✍️ yozish. Bitta unit — 3 kun, yakshanba — dam olish.</p>
          <p><b>Muhim:</b> topshiriq faqat o'sha kuni ball beradi. O'tib ketgan kunlarni Practice box'da ballsiz ishlash mumkin.</p>
          <button class="btn btn-brand btn-block" id="t-go">▶ Bugundan boshlash</button></div>`
      : `<div class="card"><p style="margin:0">📅 Kunlik topshiriqlar ustoz A1 darajasini ochgach boshlanadi.</p></div>`;
    else if (t.none) body = `<div class="card"><p style="margin:0">📅 Sizning jadvalingiz ${fmtDate(S.dstart)} kuni boshlangan.</p></div>`;
    else if (t.rest) body = `<div class="card"><h3 style="margin:0 0 6px">😌 Dam olish kuni</h3><p style="margin:0" class="muted">Yakshanba topshiriq yo'q. Xohlasangiz, Practice box'da o'tgan kunlarni takrorlang.</p></div>`;
    else if (t.soon) body = `<div class="card"><p style="margin:0">⏳ Bu kun uchun topshiriqlar tez orada qo'shiladi${t.n ? ` (${unitName(t.n)})` : ""}.</p></div>`;
    else if (t.locked) body = `<div class="card"><p style="margin:0">🔒 ${unitName(t.n)}ni ustoz hali ochmagan.</p></div>`;
    else {
      const { n, k } = t, day = lesson(n).days[k], live = sel === td, future = sel > td;
      const got = dayDoneOnTime(sel), dailyGot = DAILY.filter(([p]) => (onTime(sel, p) || 0) >= PASS).length;
      const row = ([p, ic, name], sub) => {
        const sc = onTime(sel, p), ok = (sc || 0) >= PASS;
        return `<button class="trow ${sub ? "sub" : ""} ${ok ? "done" : ""}" data-tp="${p}" ${live ? "" : "disabled"}>
          ${sub ? `<span class="arrow">↳</span>` : ""}<span class="t-ic">${ok ? "✓" : ic}</span>
          <span class="t-main"><b>${name}</b><span class="bar"><i style="width:${Math.min(100, sc || 0)}%"></i></span></span>
          <span class="t-pct">${future ? "🔒" : `${sc || 0}%`}</span></button>`;
      };
      body = `
        <div class="t-head"><div><small>${unitName(n)} · ${k + 1}-kun</small><b>${esc(day.title_uz)}</b></div><span class="ar">${esc(lesson(n).title)}</span></div>
        <div class="t-sum"><div><b>${live ? "Bugungi topshiriqlar" : future ? `${fmtDate(sel)} kuni ochiladi` : `${fmtDate(sel)} natijasi`}</b><span>${got}/${PARTS.length}</span></div>
          <div class="bar"><i style="width:${got * 100 / PARTS.length}%"></i></div></div>
        <div class="tcard"><div class="tcard-h"><span class="t-ic big">📋</span><span class="t-main"><b>Daily Tasks</b><small>${dailyGot}/4 qism bajarildi · 🎁 +${XP_MISSION} bonus</small></span></div>
          ${DAILY.map(x => row(x, true)).join("")}</div>
        <div class="tcard">${row(PARTS[4], false)}</div>
        ${!live && !future ? `<p class="muted t-note">⏰ Bu kun o'tib ketdi. Faqat o'sha kuni bajarilgan topshiriqlar hisoblanadi. Mashqlarni Practice box'da ballsiz ishlashingiz mumkin.</p>` : ""}
        ${live ? `<p class="muted t-note">Faqat bugun bajarilgan topshiriqlar hisoblanadi. Har qismdan ${PASS}% oling.</p>` : ""}`;
    }
    box.innerHTML = `
      <div class="week">${week.map(d => `<button class="wd ${status(d)} ${d === sel ? "sel" : ""} ${d === td ? "today" : ""}" data-date="${d}">
        <small>${WEEK[dow(d)]}</small><span>${+d.slice(8)}</span></button>`).join("")}</div>
      ${body}
      <button class="tcard pbox" id="pbox"><span class="t-ic big">🧺</span><span class="t-main"><b>Practice box</b><small>O'tgan kunlar mashqlarini ballsiz takrorlang</small></span><span class="go">›</span></button>`;
    $$(".wd").forEach(b => (b.onclick = () => { todaySel = b.dataset.date; renderToday(); }));
    $$(".trow[data-tp]").forEach(b => (b.onclick = () => startDaily(t.n, t.k, b.dataset.tp, sel)));
    $("#pbox").onclick = practiceSheet;
    const go = $("#t-go");
    if (go) go.onclick = () => { S.dstart = today(); todaySel = null; saveResult(0, 0, "state", []); renderToday(); toast("📅 Dastur boshlandi! Omad 💪"); };
  }

  // 🧺 Practice box: jadvalda o'tib ketgan (yoki bugungi) kunlar ro'yxati
  function practiceSheet() {
    const td = today(), items = [];
    for (let d = S.dstart; d && d <= td; d = addDays(d, 1)) { const t = taskFor(d); if (t.n && !t.locked) items.push({ d, ...t }); }
    sheet(`<h3>🧺 Practice box</h3><p>O'tgan kunlarning mashqlari. Bu yerda ball berilmaydi, lekin bilim mustahkamlanadi 💪</p>
      <div class="parts">${items.length ? items.reverse().map(x => `<button class="part" data-pd="${x.n}:${x.k}">
        <span class="part-ic">${dayDone(x.n, x.k) === PARTS.length ? "✓" : x.k + 1}</span><span class="t"><b>${unitName(x.n)} · ${x.k + 1}-kun</b>
        <small>${esc(lesson(x.n).days[x.k].title_uz)} · ${fmtDate(x.d)} · ${dayDone(x.n, x.k)}/${PARTS.length}</small></span><span class="go">›</span></button>`).join("")
        : `<p class="muted">Hali o'tgan kunlar yo'q.</p>`}</div>
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $$("[data-pd]").forEach(b => (b.onclick = () => { const [n, k] = b.dataset.pd.split(":").map(Number); daySheet(n, k); }));
  }
  // Bir kunning 5 qismi (mashq rejimi, ballsiz)
  function daySheet(n, k) {
    const day = lesson(n).days[k];
    sheet(`<h3>${unitName(n)} · ${k + 1}-kun</h3><p>${esc(day.title_uz)} · 🧺 mashq (ballsiz)</p>
      <div class="parts">${PARTS.map(([p, ic, name]) => {
        const sc = dayScore(n, k, p), ok = (sc || 0) >= PASS;
        return `<button class="part ${ok ? "done" : ""}" data-part="${p}"><span class="part-ic">${ok ? "✓" : ic}</span>
          <span class="t"><b>${name}</b><small>${sc != null ? `eng yaxshi: ${sc}%` : "hali ishlanmagan"}</small></span><span class="go">›</span></button>`;
      }).join("")}</div>
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $$("[data-part]").forEach(b => (b.onclick = () => { closeSheet(); startDaily(n, k, b.dataset.part, null); }));
  }
  // Xaritadan unit bosilganda: kunlari ro'yxati
  function unitSheet(n) {
    if (!S.dstart) { closeSheet(); showTab("today"); return toast("📅 Avval kunlik dasturni boshlang"); }
    const u = lesson(n), td = today();
    sheet(`<h3>${unitName(n)} · <span class="ar">${esc(u.title)}</span></h3><p>${esc(D.lessonTitles[n])} · ${u.days.length} kun</p>
      <div class="parts">${u.days.map((day, k) => {
        const d = dateOf(n, k), st = !d ? "🔒 jadvalda keyinroq" : d > td ? `🔒 ${fmtDate(d)} kuni ochiladi` : d === td ? "📅 Bugungi topshiriq" : `${fmtDate(d)} · ${dayDone(n, k)}/${PARTS.length}`;
        return `<button class="part ${dayDone(n, k) === PARTS.length ? "done" : d === td ? "next" : ""}" data-uk="${k}" data-d="${d || ""}">
          <span class="part-ic">${dayDone(n, k) === PARTS.length ? "✓" : k + 1}</span><span class="t"><b>${k + 1}-kun: ${esc(day.title_uz)}</b><small>${st}</small></span><span class="go">›</span></button>`;
      }).join("")}</div>
      <p class="muted" style="font-size:13px">Unit har kuni «📅 Bugun» bo'limida beriladi. O'tgan kunlarni shu yerdan ballsiz takrorlash mumkin.</p>
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $$("[data-uk]").forEach(b => (b.onclick = () => {
      const d = b.dataset.d, k = +b.dataset.uk;
      if (!d || d > td) return toast("🔒 Bu kun hali kelmadi");
      if (d === td) { closeSheet(); todaySel = td; showTab("today"); return; }
      daySheet(n, k);
    }));
  }

  function lessonSheet(n) {
    if (!isOpen(n)) return startLesson(n);   // yopiq bo'lsa sababini aytadi
    if (hasParts(n)) return unitSheet(n);
    const best = S.lessons[n] || 0;
    sheet(`<h3>${lname(n)} · <span class="ar">${esc(lesson(n).title)}</span></h3>
      <p>${esc(D.lessonTitles[n])}</p>
      <p>${passed(n) ? `✅ O'tilgan · eng yaxshi natija: <b>${best}%</b>` : best ? `Eng yaxshi natija: ${best}%. O'tish uchun ${PASS}% kerak` : `${n > 100 ? 15 : 10} ta savol. O'tish uchun ${PASS}% kerak`}</p>
      <button class="btn btn-brand btn-block" id="ls-go">${passed(n) ? "Qayta ishlash" : "Boshlash"} →</button>
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $("#ls-go").onclick = () => { closeSheet(); startLesson(n); };
  }

  let wordLesson = 1, hideMeaning = false;
  function renderWords() {
    const open = groupLessons().map(l => l.number);
    if (!open.includes(wordLesson)) wordLesson = open[open.length - 1];
    $("#w-seg").innerHTML = D.lessons.map(l => `<button aria-pressed="${l.number === wordLesson}" data-wl="${l.number}" ${open.includes(l.number) ? "" : "disabled"}>${l.number > 100 ? `A1·${l.number - 100}` : l.number}. <span class="ar">${esc(l.title)}</span></button>`).join("");
    const l = lesson(wordLesson);
    $("#w-count").textContent = `${l.words.length} ta so'z`;
    $("#w-hide").textContent = hideMeaning ? "👀 Ma'nosini ko'rsatish" : "🙈 Ma'nosini yashirish";
    $("#w-list").innerHTML = l.words.map((w, i) => `<button class="word ${hideMeaning ? "hide" : ""}" data-wi="${i}"><span class="ar">${esc(w.ar)}</span><small>${esc(w.uz)}</small></button>`).join("");
    const phr = [...(l.dialogs || []).map(d => ({ ar: d.say, uz: "↪ " + d.reply, audio: d.say })), ...(l.phrases || []).map(p => ({ ar: p.ar, uz: p.uz }))];
    $("#w-phrases").innerHTML = phr.map((p, i) => `<button class="phrase" data-pi="${i}"><span class="t"><span class="ar">${esc(p.ar)}</span><small class="${isAr(p.uz) ? "ar" : ""}">${esc(p.uz)}</small></span>${p.audio ? `<span class="listen" aria-hidden="true">🔊</span>` : ""}</button>`).join("");
    $$("#w-seg button").forEach(b => (b.onclick = () => { wordLesson = +b.dataset.wl; renderWords(); }));
    $$("#w-list .word").forEach(b => (b.onclick = () => { play(l.words[+b.dataset.wi].ar); b.classList.remove("hide"); }));
    $$("#w-phrases .phrase").forEach(b => (b.onclick = () => { const p = phr[+b.dataset.pi]; if (p.audio) play(p.audio); }));
  }

  function renderProfile() {
    $("#p-ava").textContent = (ME.name || "D")[0].toUpperCase();
    $("#p-name").textContent = ME.name;
    $("#p-rank").textContent = rankOf(ME.xp);
    $("#p-xp").textContent = ME.xp;
    $("#p-streak").textContent = streakNow();
    $("#p-lessons").textContent = `${D.lessons.filter(l => passed(l.number)).length}/${D.lessons.length}`;
    $("#p-exam").textContent = S.examBest ? S.examBest + "%" : "—";
    const have = new Set(S.badges);
    $("#p-badge-sum").textContent = `${have.size}/${BADGES.length}`;
    $("#p-badges").innerHTML = BADGES.map(([c, e, n, d]) => `<div class="bdg ${have.has(c) ? "" : "off"}"><div class="e">${e}</div><b>${esc(n)}</b><small>${esc(d)}</small></div>`).join("");
  }

  // Reyting: haftalik — o'z guruhi ichida, oylik — barcha guruhlar bo'yicha umumiy
  let boardMode = "week";
  const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  async function renderBoard() {
    $$("[data-board]").forEach(b => b.setAttribute("aria-pressed", b.dataset.board === boardMode));
    $("#t-note").textContent = boardMode === "week" ? "Guruhingiz ichida · dushanba noldan boshlanadi" : "Barcha guruhlar · har oy 1-sanada noldan";
    const medal = ["🥇", "🥈", "🥉"];
    if (boardMode === "month") {
      $("#t-champ").hidden = true;
      try {
        const b = await rpc("leaderboard_month", { p_token: TOKEN });
        if (boardMode !== "month") return;
        const mon = MONTHS[+b.month.slice(5) - 1];
        const mine = b.mine && !b.top.some(r => r.id === b.me)
          ? `<div class="row me"><span class="rank">${b.mine.rank}</span><span class="ava">${esc(ME.name[0])}</span><span class="name"><b>${esc(ME.name)} (siz)</b></span><span class="xp">${b.mine.xp}</span></div>` : "";
        $("#t-board").innerHTML = `<p class="muted" style="margin:6px 0">🗓 ${cap(mon)} oyi · TOP ${b.top.length}</p>` + (b.top.length ? b.top.map(r => `
          <div class="row ${r.id === b.me ? "me" : ""}">
            <span class="rank">${medal[r.rank - 1] || r.rank}</span><span class="ava">${esc(r.name[0])}</span>
            <span class="name"><b>${esc(r.name)}${r.id === b.me ? " (siz)" : ""}</b><small class="muted">${esc(r.group)}</small></span>
            <span class="xp">${r.xp}</span></div>`).join("") + mine
          : `<p class="muted">Bu oy hali hech kim ball yig'madi. Birinchi bo'ling! 🔥</p>`);
      } catch (e) { $("#t-board").innerHTML = `<p class="muted">${esc(errText(e))}</p>`; }
      return;
    }
    try {
      const b = await rpc("leaderboard", { p_token: TOKEN });
      if (boardMode !== "week") return;
      $("#t-champ").hidden = !b.champion;
      if (b.champion) $("#t-champ").innerHTML = `<small>👑 O'tgan hafta chempioni</small><b>${esc(b.champion.name)}</b> · ${b.champion.xp} XP`;
      $("#t-board").innerHTML = b.week.length ? b.week.map((r, i) => `
        <div class="row ${r.id === b.me ? "me" : ""}">
          <span class="rank">${medal[i] || i + 1}</span><span class="ava">${esc(r.name[0])}</span>
          <span class="name"><b>${esc(r.name)}${b.champion && b.champion.id === r.id ? " 👑" : ""}${r.id === b.me ? " (siz)" : ""}</b></span>
          <span class="xp">${r.xp}</span></div>`).join("")
        : `<p class="muted">Bu hafta hali hech kim ball yig'madi. Birinchi bo'ling! 🔥</p>`;
    } catch (e) { $("#t-board").innerHTML = `<p class="muted">${esc(errText(e))}</p>`; }
  }

  // ---------- Kirish ----------
  let authMode = "join";
  function showAuth() {
    $("#auth").hidden = false;
    const setMode = m => {
      authMode = m;
      $("#auth-tab-join").setAttribute("aria-pressed", m === "join");
      $("#auth-tab-login").setAttribute("aria-pressed", m === "login");
      $("#auth-pin-hint").textContent = m === "join" ? "(4 ta raqam, o'zingiz o'ylab toping va eslab qoling)" : "(ro'yxatdan o'tgandagi 4 ta raqam)";
      $("#auth-submit").textContent = m === "join" ? "Boshlash 🚀" : "Kirish";
      $("#auth-err").hidden = true;
    };
    $("#auth-tab-join").onclick = () => setMode("join");
    $("#auth-tab-login").onclick = () => setMode("login");
    $("#auth-pin").oninput = e => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4));
    $("#auth-form").onsubmit = async e => {
      e.preventDefault();
      const code = $("#auth-code").value.trim(), name = $("#auth-name").value.trim(), pin = $("#auth-pin").value.trim();
      const err = msg => { $("#auth-err").textContent = msg; $("#auth-err").hidden = false; };
      if (!code) return err("Guruh kodini yozing.");
      if (name.length < 2) return err(ERRORS.BAD_NAME);
      if (!/^\d{4}$/.test(pin)) return err(ERRORS.BAD_PIN);
      $("#auth-submit").disabled = true;
      try {
        const r = await rpc(authMode === "join" ? "join_group" : "login", { p_code: code, p_name: name, p_pin: pin });
        TOKEN = r.token; store.set(K_TOKEN, TOKEN);
        $("#auth").hidden = true;
        await boot();
        if (authMode === "join") toast(`Xush kelibsiz, ${ME.name}! 🎉 PIN'ingizni eslab qoling`);
      } catch (ex) { err(errText(ex)); }
      finally { $("#auth-submit").disabled = false; }
    };
    setMode(authMode);
  }

  function logout(expired) {
    TOKEN = null; ME = null; S = fresh();
    store.del(K_TOKEN); store.del(K_CACHE); store.del(K_PENDING);
    closeSheet();
    showAuth();
    if (expired) toast(ERRORS.AUTH);
  }

  async function boot() {
    try {
      ME = await rpc("me", { p_token: TOKEN });
      S = Object.assign(fresh(), ME.state || {});
      store.set(K_CACHE, JSON.stringify({ ME, S }));
    } catch (e) {
      if (e.message === "AUTH") return logout(true);
      // Internet yo'q — oxirgi saqlangan holat bilan ishlaymiz
      try { const c = JSON.parse(store.get(K_CACHE) || "null"); if (c) { ME = c.ME; S = Object.assign(fresh(), c.S); } } catch { /* */ }
      if (!ME) { toast(ERRORS.NET); return setTimeout(boot, 5000); }
      toast("📶 Internet yo'q. Natijalar keyin yuboriladi");
    }
    render();
    flushPending();
    loadInbox();
    loadSpeakBadge();
    // Taklif havolasi orqali kelgan bo'lsa — taklif qilganni bog'laymiz (faqat yangi hisob uchun ishlaydi)
    const ref = store.get(K_REF);
    if (ref) { store.del(K_REF); try { const r = await rpc("ref_set", { p_token: TOKEN, p_ref: ref }); if (r.ok) toast(`🤝 ${r.inviter} taklifi qabul qilindi! Birinchi darsni o'ting, ikkalangizga +${REF_BONUS} XP`); } catch { /* */ } }
    loadRef();
    refClaim();
  }

  // ---------- Ustoz paneli ----------
  let TT = null, TC = null;

  // Darslarni ochish: har bir daraja alohida. Bazada bitta son (umumiy tartib bo'yicha nechta dars ochiq)
  function renderTcLevels(g) {
    const groups = LEVELS.map(([code, name]) => ({ code, name, ls: D.lessons.filter(l => levelOf(l.number) === code) })).filter(x => x.ls.length && OPEN_FIELD[x.code]);
    $("#tc-levels").innerHTML = groups.map((gr, i) => {
      const n = gr.ls.length, k = Math.min(n, openCount(gr.code, g)), min = gr.code === "Pre-A1" ? 1 : 0;
      const last = k ? gr.ls[k - 1] : null;
      const note = last ? `Oxirgisi: ${lname(last.number)} · ${D.lessonTitles[last.number]}` : "Hali ochilmagan";
      return `<div class="tc-row"><span style="min-width:0"><b>${gr.code} · <span class="ar">${gr.name}</span></b><small class="muted">${esc(note)}</small></span>
        <span class="stepper"><button class="btn btn-soft" data-lv="${i}" data-d="-1" ${k > min ? "" : "disabled"} aria-label="Bittasini yopish">−</button><b>${k}/${n}</b>
        <button class="btn btn-brand" data-lv="${i}" data-d="1" ${k < n ? "" : "disabled"} aria-label="Keyingisini ochish">+</button></span></div>`;
    }).join("");
    $$("#tc-levels [data-lv]").forEach(b => (b.onclick = () => {
      const code = groups[+b.dataset.lv].code, v = openCount(code, g) + +b.dataset.d;
      teacherSet(code === "Pre-A1" ? v : null, null, code === "A1" ? v : null);
    }));
  }
  async function teacherLoad() {
    try { TC = await rpc("teacher_overview", { p_token: TT }); }
    catch (e) {
      if (e.message === "TEACHER_AUTH") {   // seans tugagan yoki parol o'zgargan
        TT = null; store.del(K_TEACHER); store.del(K_MODE);
        toast(ERRORS.TEACHER_AUTH);
        return showStudentSide();
      }
      $("#tc-list").innerHTML = `<div class="card"><p>${esc(errText(e))}</p></div>`;
      return;
    }
    const g = TC.group, t = TC.today;
    $("#tc-group").textContent = g.name;
    renderTcLevels(g);
    $("#tc-exam-state").textContent = g.exam_open ? "ochiq ✅" : "yopiq 🔒";
    $("#tc-exam").textContent = g.exam_open ? "Yopish" : "Ochish";
    $("#tc-exam").className = "btn " + (g.exam_open ? "btn-danger" : "btn-brand");

    const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
    const studs = TC.students;
    const activeToday = studs.filter(s => (s.days || {})[t]).length;
    const active7 = studs.filter(s => Object.keys(s.days || {}).length).length;
    $("#tc-stats").innerHTML = `
      <div class="tc-stat"><b>${studs.length}</b><small>talaba</small></div>
      <div class="tc-stat"><b>${activeToday}</b><small>bugun faol</small></div>
      <div class="tc-stat"><b>${active7}</b><small>7 kunda faol</small></div>`;
    const peak = Math.max(1, ...studs.flatMap(s => Object.values(s.days || {})));
    $("#tc-list").innerHTML = studs.length ? studs.map(s => {
      const per = days.map(d => (s.days || {})[d] || 0);
      const act = per.filter(Boolean).length;
      const dot = act >= 5 ? "🟢" : act >= 2 ? "🟡" : "🔴";
      const spark = per.map(n => `<i class="${n ? "" : "zero"}" style="height:${n ? Math.max(4, Math.round(Math.log(n + 1) / Math.log(peak + 1) * 26)) : 3}px" title="${n} ta javob"></i>`).join("");
      const lessonsPassed = Object.values(s.lessons || {}).filter(v => v >= PASS).length;
      const skills = Object.entries(s.skills || {}).map(([k, [c, n]]) => `${SKILLS[k] ? SKILLS[k].split(" ")[0] : k} ${Math.round(c * 100 / n)}%`).join(" · ");
      const seen = s.last_seen ? new Date(s.last_seen) : null;
      const ago = seen ? Math.floor((Date.now() - seen) / 86400000) : null;
      const agoTxt = ago === null ? "—" : ago === 0 ? "bugun" : ago === 1 ? "kecha" : `${ago} kun oldin`;
      return `<div class="st">
        <button class="st-row" data-open aria-expanded="false"><span>${dot}</span><span class="name"><b>${esc(s.name)}</b><small>oxirgi: ${agoTxt} · 📚 ${lessonsPassed}/${D.lessons.length}</small></span>
          <span class="spark" aria-label="7 kunlik faollik">${spark}</span><span class="xp">⭐ ${s.week_xp}</span></button>
        <div class="st-more" hidden>
          <div class="st-meta"><span>⭐ ${s.week_xp} hafta / ${s.xp} jami</span><span>🔥 ${s.streak}</span>
            ${s.exam_best ? `<span>🎓 ${s.exam_best}%</span>` : ""}<span>❌ ${s.mistakes}</span><span>⚔️ ${s.duel_wins}/${s.duels}</span>${skills ? `<span>${esc(skills)}</span>` : ""}</div>
          <div class="st-actions"><button class="btn btn-soft" data-pin="${s.id}" data-name="${esc(s.name)}">🔑 PIN yangilash</button>
            <button class="btn btn-danger" data-del="${s.id}" data-name="${esc(s.name)}">O'chirish</button></div></div></div>`;
    }).join("") : `<div class="card"><p>Hali talabalar yo'q. Ularga ilova havolasi va <b>DOD_ARABIC</b> kodini bering.</p></div>`;
    $("#tc-hard").innerHTML = TC.hardest.length ? TC.hardest.map(h => `<div class="hard"><span class="${isAr(h.topic) ? "ar" : ""}">${esc(h.topic)}</span><b>${h.wrong}/${h.total} xato</b></div>`).join("")
      : `<p class="muted" style="margin:0">Hozircha ma'lumot yetarli emas.</p>`;
    $("#tc-duels").innerHTML = TC.duels.length ? TC.duels.map(d => `<div class="hard"><span>${esc(d.a)} ⚔️ ${esc(d.b)}</span><b>${d.status === "done" ? `${d.a_score}:${d.b_score} · ${d.winner ? "🏆 " + esc(d.winner) : "🤝"}` : d.status === "declined" ? "rad etildi" : "kutilmoqda"}</b></div>`).join("")
      : `<p class="muted" style="margin:0">Oxirgi 24 soatda duel bo'lmadi.</p>`;

    rpc("teacher_refs", { p_token: TT }).then(refs => {
      $("#tc-refs-sum").textContent = refs.length ? `${refs.filter(x => x.done).length}/${refs.length}` : "hali yo'q";
      $("#tc-refs").innerHTML = refs.length ? refs.map(x => `<div class="hard"><span>${esc(x.by)} → <b>${esc(x.name)}</b></span><small>${x.done ? "✅ +100 XP berildi" : "⏳ 1-dars kutilmoqda"}</small></div>`).join("")
        : `<p class="muted" style="margin:0">Hali hech kim do'stini taklif qilmagan.</p>`;
    }).catch(() => {});
    $$("#tc-list [data-open]").forEach(b => (b.onclick = () => {
      const more = b.nextElementSibling; more.hidden = !more.hidden; b.setAttribute("aria-expanded", !more.hidden);
    }));
    $$("[data-pin]").forEach(b => (b.onclick = async () => {
      try {
        const r = await rpc("teacher_reset_pin", { p_token: TT, p_student: b.dataset.pin });
        sheet(`<h3>🔑 Yangi PIN</h3><p><b style="color:var(--ink)">${b.dataset.name}</b> uchun yangi PIN:</p>
          <div class="q-card"><div style="font-family:var(--f-display);font-size:40px;letter-spacing:.2em">${r.pin}</div></div>
          <p>Talabaga ayting: ilovada «Menda hisob bor» bo'limidan ismi va shu PIN bilan kiradi.</p><button class="btn btn-brand btn-block" data-close>Tushunarli</button>`);
      } catch (e) { toast(errText(e)); }
    }));
    $$("[data-del]").forEach(b => (b.onclick = () => {
      sheet(`<h3>O'chirasizmi?</h3><p><b style="color:var(--ink)">${b.dataset.name}</b> va uning barcha natijalari o'chadi. Buni qaytarib bo'lmaydi.</p>
        <button class="btn btn-danger btn-block" id="del-yes">Ha, o'chirish</button><button class="btn btn-soft btn-block" data-close>Bekor qilish</button>`);
      $("#del-yes").onclick = async () => { try { await rpc("teacher_remove", { p_token: TT, p_student: b.dataset.del }); } catch (e) { toast(errText(e)); } closeSheet(); teacherLoad(); };
    }));
  }

  // Ustoz: ovozli javoblarni tinglash va baholash
  let tcPlayer = null;
  async function teacherSpeakLoad() {
    let list;
    try { list = await rpc("teacher_speaking", { p_token: TT }); }
    catch (e) { $("#tc-speak").innerHTML = `<div class="card"><p class="muted">${esc(errText(e))}</p></div>`; return; }
    const pend = list.filter(x => x.pending);
    $("#tc-speak-sum").textContent = pend.length ? `⏳ ${pend.length} ta baholanmagan javob bor` : "Hammasi baholangan ✅";
    $("#tc-speak-count").hidden = !pend.length; $("#tc-speak-count").textContent = pend.length;
    if (!list.length) { $("#tc-speak").innerHTML = `<div class="card"><p class="muted" style="margin:0">Hali ovozli javob yo'q.</p></div>`; return; }
    const when = d => new Date(d).toLocaleString("uz", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    $("#tc-speak").innerHTML = list.map(x => `
      <div class="st" data-sp="${x.id}">
        <div class="st-head"><span>${x.pending ? "⏳" : "✅"}</span><span class="name"><b>${esc(x.name)}</b><small>${esc(x.topic)} · ${fmt(x.seconds)} · ${when(x.created_at)}</small></span>
          ${x.has_audio ? `<button class="btn btn-soft" data-listen="${x.id}" style="padding:8px 12px">▶️ Tinglash</button>` : `<small class="muted">ovoz o'chirilgan</small>`}</div>
        <div class="audio-slot"></div>
        ${x.pending ? `<div class="stars" role="group" aria-label="Baho">${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" aria-pressed="false">${n}⭐</button>`).join("")}</div>
          <textarea class="input" placeholder="Izoh (ixtiyoriy): masalan, ض harfiga e'tibor bering" maxlength="500"></textarea>
          <button class="btn btn-brand btn-block" data-grade="${x.id}" disabled>Baho qo'yish</button>`
        : `<div class="st-meta"><span>${"⭐".repeat(x.score)}</span>${x.comment ? `<span>💬 ${esc(x.comment)}</span>` : ""}</div>`}
      </div>`).join("");
    $$("[data-listen]").forEach(b => (b.onclick = async () => {
      const card = b.closest("[data-sp]"), slot = card.querySelector(".audio-slot");
      b.disabled = true; b.textContent = "⏳";
      try {
        const a = await rpc("teacher_speaking_audio", { p_token: TT, p_id: +b.dataset.listen });
        const bytes = Uint8Array.from(atob(a.b64), c => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: a.mime.split(";")[0] }));
        slot.innerHTML = `<audio controls src="${url}" style="width:100%"></audio>`;
        if (tcPlayer) tcPlayer.pause();
        tcPlayer = slot.querySelector("audio"); tcPlayer.play().catch(() => { /* foydalanuvchi o'zi bosadi */ });
        b.textContent = "▶️ Tinglash";
      } catch (e) { toast(errText(e)); b.textContent = "▶️ Tinglash"; }
      b.disabled = false;
    }));
    $$("[data-sp]").forEach(card => {
      let score = 0;
      card.querySelectorAll("[data-star]").forEach(s => (s.onclick = () => {
        score = +s.dataset.star;
        card.querySelectorAll("[data-star]").forEach(x => x.setAttribute("aria-pressed", +x.dataset.star <= score));
        card.querySelector("[data-grade]").disabled = false;
      }));
      const g = card.querySelector("[data-grade]");
      if (g) g.onclick = async () => {
        g.disabled = true;
        try {
          await rpc("teacher_speaking_grade", { p_token: TT, p_id: +g.dataset.grade, p_score: score, p_comment: card.querySelector("textarea").value });
          toast(`✅ Baho qo'yildi: ${score}⭐ (+${score * 6} XP)`);
          teacherSpeakLoad();
        } catch (e) { toast(errText(e)); g.disabled = false; }
      };
    });
  }

  // Ustoz: haftalik hisobot
  async function teacherReport(offset = 0) {
    let r;
    try { r = await rpc("teacher_report", { p_token: TT, p_week_offset: offset }); } catch (e) { return toast(errText(e)); }
    const d = s => s.slice(8, 10) + "." + s.slice(5, 7);
    const st = r.students;
    const active = st.filter(s => s.answers > 0 || s.speak_n > 0);
    const idle = st.filter(s => !(s.answers > 0 || s.speak_n > 0));
    const tot = st.reduce((a, s) => [a[0] + s.correct, a[1] + s.answers], [0, 0]);
    const pct = (c, n) => (n ? Math.round(c * 100 / n) + "%" : "—");
    const medals = ["🥇", "🥈", "🥉"];
    // Ixcham jadval: bir talaba = bir qator; bosilsa tafsilot ochiladi
    const rows = active.map((s, i) => {
      const skills = Object.entries(s.skills || {}).map(([k, [c, n]]) => `${SKILLS[k] ? SKILLS[k].split(" ")[0] : k} ${pct(c, n)}`).join(" · ");
      const lessonsPassed = Object.values(s.lessons || {}).filter(v => v >= PASS).length;
      return `<details class="rep-d"><summary class="rep-row"><b>${i < 3 ? medals[i] + " " : ""}${esc(s.name)}</b><span>⭐${s.week_xp}</span><small>${s.active_days}/7</small><small>${pct(s.correct, s.answers)}</small></summary>
        <div class="rep-st" style="box-shadow:none;margin:6px 0 10px">
          <small>🎯 ${s.answers} javob${skills ? ` · ${esc(skills)}` : ""}</small>
          <small>📚 ${lessonsPassed}/${D.lessons.length} · ⚔️ ${s.duel_wins}/${s.duels} · ❌ ${s.mistakes}${s.speak_n ? ` · 🎤 ${s.speak_n}${s.speak_avg ? ` (⭐${s.speak_avg})` : ""}` : ""}${s.exam_best ? ` · 🎓 ${s.exam_best}%` : ""}</small>
          ${s.weak.length ? `<small>⚠️ <span class="ar">${s.weak.map(esc).join("، ")}</span></small>` : ""}</div></details>`;
    }).join("");
    sheet(`<h3>📈 Haftalik hisobot · ${d(r.monday)}–${d(r.sunday)}</h3>
      <div class="seg" style="margin:0"><button aria-pressed="${offset === 0}" data-wk="0">Shu hafta</button><button aria-pressed="${offset === 1}" data-wk="1">O'tgan hafta</button></div>
      <div class="tc-stats" style="margin:0">
        <div class="tc-stat"><b>${active.length}/${st.length}</b><small>faol</small></div>
        <div class="tc-stat"><b>${pct(tot[0], tot[1])}</b><small>aniqlik</small></div>
        <div class="tc-stat"><b>${tot[1]}</b><small>javob</small></div></div>
      <div class="card" style="padding:4px 14px">
        <div class="rep-row rep-head"><span>Talaba (bosing)</span><span>XP</span><span>kun</span><span>%</span></div>
        ${rows || `<p class="muted">Bu haftada faollik yo'q.</p>`}</div>
      ${idle.length ? `<details class="card tc-more" style="margin:0"><summary>😴 Kirmaganlar: ${idle.length}</summary><p>${idle.map(s => esc(s.name)).join(", ")}</p></details>` : ""}
      ${r.hardest.length ? `<details class="card tc-more" style="margin:0"><summary>🧩 Qiynalgan mavzular: ${r.hardest.length}</summary>${r.hardest.map(h => `<div class="hard"><span class="${isAr(h.topic) ? "ar" : ""}">${esc(h.topic)}</span><b>${h.wrong}/${h.total}</b></div>`).join("")}</details>` : ""}
      <button class="btn btn-soft btn-block" data-close>Yopish</button>`);
    $$("[data-wk]").forEach(b => (b.onclick = () => teacherReport(+b.dataset.wk)));
  }

  async function teacherSet(open, exam, a1 = null) {
    try { await rpc("teacher_set", { p_token: TT, p_open_lessons: open, p_exam_open: exam, p_open_a1: a1 }); toast("✅ Saqlandi"); }
    catch (e) { toast(errText(e)); }
    teacherLoad();
  }

  // Ustoz paroli: bir marta o'rnatiladi, keyin ilovaga «Men ustozman» orqali kiriladi
  function passSheet() {
    sheet(`<h3>🔑 Ustoz paroli</h3>
      <p>Kamida 6 ta belgi. Uni hech kimga aytmang: parol bilan guruhdagi hamma talabalarni boshqarish mumkin.</p>
      <input class="input" id="tp-1" type="password" autocomplete="new-password" placeholder="Yangi parol">
      <input class="input" id="tp-2" type="password" autocomplete="new-password" placeholder="Parolni takrorlang">
      <p class="auth-err" id="tp-err" hidden></p>
      <button class="btn btn-brand btn-block" id="tp-save">Saqlash</button><button class="btn btn-soft btn-block" data-close>Bekor qilish</button>`);
    $("#tp-save").onclick = async () => {
      const a = $("#tp-1").value, b = $("#tp-2").value, err = m => { $("#tp-err").textContent = m; $("#tp-err").hidden = false; };
      if (a.length < 6) return err("Parol kamida 6 ta belgidan iborat bo'lsin");
      if (a !== b) return err("Ikkala parol bir xil emas");
      try { await rpc("teacher_set_password", { p_token: TT, p_password: a }); closeSheet(); toast("✅ Parol saqlandi. Endi «Men ustozman» orqali kirasiz"); $("#tc-pass-card").hidden = true; }
      catch (e) { err(errText(e)); }
    };
  }
  function teacherLoginSheet() {
    sheet(`<h3>👨‍🏫 Ustoz sifatida kirish</h3>
      <input class="input" id="tl-code" autocapitalize="characters" placeholder="Guruh kodi: DOD_ARABIC">
      <input class="input" id="tl-pass" type="password" autocomplete="current-password" placeholder="Ustoz paroli">
      <p class="auth-err" id="tl-err" hidden></p>
      <button class="btn btn-brand btn-block" id="tl-go">Kirish</button><button class="btn btn-soft btn-block" data-close>Bekor qilish</button>
      <p style="font-size:12.5px">Parolni birinchi marta ustoz havolasi orqali kirib, ⚙️ bo'limida o'rnatasiz.</p>`);
    $("#tl-go").onclick = async () => {
      const err = m => { $("#tl-err").textContent = m; $("#tl-err").hidden = false; };
      $("#tl-go").disabled = true;
      try {
        const r = await rpc("teacher_login", { p_code: $("#tl-code").value, p_password: $("#tl-pass").value });
        if (r.error) return err(ERRORS[r.error] || errText(new Error(r.error)));
        TT = r.token; store.set(K_TEACHER, TT); store.set(K_MODE, "teacher");
        closeSheet(); $("#auth").hidden = true; startTeacher();
      } catch (e) { err(errText(e)); }
      finally { $("#tl-go").disabled = false; }
    };
  }
  function showStudentSide() {
    store.set(K_MODE, "student");
    $("#teacher").hidden = true; $(".tabbar").hidden = false; $("#p-teacher").hidden = !TT;
    if (TOKEN) { boot(); $("#auth").hidden = true; } else showAuth();
  }

  function startTeacher() {
    store.set(K_MODE, "teacher");
    $("#teacher").hidden = false;
    $(".tabbar").hidden = true;
    $("#tc-exam").onclick = () => teacherSet(null, !TC.group.exam_open);
    $("#tc-report").onclick = () => teacherReport(0);
    $("#tc-refresh").onclick = () => { teacherLoad(); teacherSpeakLoad(); };
    $$("[data-tct]").forEach(b => (b.onclick = () => {
      $$("[data-tct]").forEach(x => x.setAttribute("aria-pressed", x === b));
      $$("[data-tcp]").forEach(p => (p.hidden = p.dataset.tcp !== b.dataset.tct));
      window.scrollTo({ top: 0 });
    }));
    $$("[data-pass]").forEach(b => (b.onclick = passSheet));
    $("#tc-as-student").onclick = showStudentSide;
    $("#tc-logout").onclick = async () => {
      try { await rpc("teacher_logout", { p_token: TT }); } catch { /* baribir chiqamiz */ }
      TT = null; store.del(K_TEACHER); store.del(K_MODE);
      showStudentSide();
    };
    rpc("teacher_password_status", { p_token: TT }).then(r => ($("#tc-pass-card").hidden = r.set)).catch(() => {});
    teacherLoad();
    teacherSpeakLoad();
  }

  // ---------- Hodisalar ----------
  $("#m-start").onclick = startMission;
  $$("[data-act]").forEach(b => (b.onclick = () => {
    const a = b.dataset.act;
    if (a === "listen") startListen();
    else if (a === "review") startReview();
    else if (a === "speak") speakSheet();
    else if (a === "duel") { duelSheet(); loadInbox().then(() => { if ($("#duel-new")) duelSheet(); }); }
  }));
  $("#w-hide").onclick = () => { hideMeaning = !hideMeaning; renderWords(); };
  // Ko'rinish: Premium (asosiy) yoki Krem
  function applyStyle(s) {
    document.documentElement.dataset.style = s;
    $('meta[name="theme-color"]').content = s === "krem" ? "#1F4D3A" : "#0C1218";
    $$("[data-style-pick]").forEach(b => b.setAttribute("aria-pressed", b.dataset.stylePick === s));
  }
  $$("[data-style-pick]").forEach(b => (b.onclick = () => { store.set("dod_style", b.dataset.stylePick); applyStyle(b.dataset.stylePick); }));
  applyStyle(document.documentElement.dataset.style || "premium");
  $("#p-rename").hidden = true;   // ism ro'yxatdan o'tishda beriladi, o'zgartirish ustoz orqali
  $("#p-reset").hidden = true;
  $("#p-logout").onclick = () => {
    sheet(`<h3>Chiqasizmi?</h3><p>Qayta kirish uchun guruh kodi, ismingiz va PIN kerak bo'ladi. Natijalaringiz saqlanib qoladi.</p>
      <button class="btn btn-danger btn-block" id="out-yes">Ha, chiqish</button><button class="btn btn-soft btn-block" data-close>Bekor qilish</button>`);
    $("#out-yes").onclick = () => logout(false);
  };
  $$(".tab").forEach(t => (t.onclick = () => {
    $$(".tab").forEach(x => x.removeAttribute("aria-current"));
    t.setAttribute("aria-current", "page");
    ["home", "today", "lessons", "top", "words", "profile"].forEach(s => ($("#screen-" + s).hidden = s !== t.dataset.tab));
    if (t.dataset.tab === "today") { todaySel = null; renderToday(); }
    if (t.dataset.tab === "top") renderBoard();    window.scrollTo({ top: 0 });
  }));
  document.addEventListener("keydown", e => {
    if (!run || $("#sheet-root").innerHTML || e.target.tagName === "INPUT") return;
    const k = "abcd".indexOf(e.key.toLowerCase());
    if (k >= 0 && run.qs[run.i] && run.qs[run.i].options && k < run.qs[run.i].options.length && run.locked !== run.i) answer(k);
    else if (e.key === "Enter" && $("#next")) $("#next").click();
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && TOKEN && $("#teacher").hidden) { loadInbox(); flushPending(); } });

  // ---------- Telefonga o'rnatish ----------
  let installPrompt = null;
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const inTelegram = /Telegram/i.test(navigator.userAgent) || !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  function showInstallCard() {
    const hidden = standalone() || inTelegram || store.get("dod_install_hide") === "1";
    $("#install").hidden = hidden;
  }
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; showInstallCard(); });
  window.addEventListener("appinstalled", () => { $("#install").hidden = true; toast("🎉 Dod telefoningizga o'rnatildi!"); });
  $("#install").onclick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const r = await installPrompt.userChoice.catch(() => null);
      installPrompt = null;
      if (r && r.outcome === "accepted") $("#install").hidden = true;
      return;
    }
    sheet(`<h3>📲 Telefonga o'rnatish</h3>
      ${isIOS ? `<ol class="steps"><li><b>Safari</b> brauzerida oching (boshqa brauzerda bu ishlamaydi).</li>
        <li>Pastdagi <b>Ulashish</b> tugmasini bosing (kvadrat va yuqoriga strelka ⬆️).</li>
        <li>Ro'yxatdan <b>«На экран Домой»</b> (Add to Home Screen) ni tanlang.</li>
        <li>O'ng yuqoridagi <b>Добавить</b> (Add) ni bosing.</li></ol>`
      : `<ol class="steps"><li><b>Chrome</b> brauzerida oching.</li>
        <li>O'ng yuqoridagi <b>⋮</b> (uch nuqta) tugmasini bosing.</li>
        <li><b>«Установить приложение»</b> yoki <b>«Добавить на главный экран»</b> ni tanlang.</li>
        <li><b>Установить</b> ni bosing.</li></ol>`}
      <p>Shundan keyin telefoningiz ekranida <b style="color:var(--ink)">ض Dod</b> ikonkasi paydo bo'ladi.</p>
      <button class="btn btn-brand btn-block" data-close>Tushunarli</button>
      <button class="btn btn-soft btn-block" id="install-hide">Boshqa ko'rsatmang</button>`);
    $("#install-hide").onclick = () => { store.set("dod_install_hide", "1"); closeSheet(); showInstallCard(); };
  };
  showInstallCard();

  // ---------- Ishga tushirish ----------
  const m = location.hash.match(/ustoz=([0-9a-f]{20,})/i);
  if (m) { store.set(K_TEACHER, m[1]); history.replaceState(null, "", location.pathname + location.search); }
  // Taklif havolasi: ?ref=KOD — eslab qolamiz, kirish oynasida kim taklif qilganini ko'rsatamiz
  const refParam = new URLSearchParams(location.search).get("ref");
  if (refParam && /^[0-9a-f]{8}$/i.test(refParam)) {
    store.set(K_REF, refParam.toLowerCase());
    history.replaceState(null, "", location.pathname + location.hash);
    rpc("ref_lookup", { p_ref: refParam }).then(r => {
      if (!r) return;
      $("#auth-ref").hidden = false;
      $("#auth-ref").textContent = `🎉 Sizni ${r.inviter} taklif qildi! Ro'yxatdan o'ting va birinchi darsni o'ting: ikkalangizga +${REF_BONUS} XP`;
      if (!$("#auth-code").value) $("#auth-code").value = r.code;
    }).catch(() => {});
  }
  $("#p-invite").onclick = shareInvite;
  $$("[data-board]").forEach(b => (b.onclick = () => { boardMode = b.dataset.board; renderBoard(); }));

  // Ustoz: havola orqali yoki avval parol bilan kirilgan bo'lsa (oxirgi tanlangan rejim eslab qolinadi)
  TT = (m && m[1]) || store.get(K_TEACHER) || null;
  $("#auth-teacher").onclick = teacherLoginSheet;
  $("#p-teacher").hidden = !TT;
  $("#p-teacher").onclick = () => { $(".tabbar").hidden = true; startTeacher(); };
  if (TT && (m || location.hash === "#ustoz" || store.get(K_MODE) === "teacher")) startTeacher();
  else if (TOKEN) boot();
  else showAuth();
})();
