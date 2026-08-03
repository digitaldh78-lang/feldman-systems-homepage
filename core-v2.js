/* ═══════════════════════════════════════════════════════════════════════════
   רכזת מחשב הבקרה — בנייה + כוריאוגרפיית גלילה
   ───────────────────────────────────────────────────────────────────────────
   מחליף את תוכן #core בבמה רדיאלית. נטען רק בעמוד הניסיוני.

   למה הכל נבנה מ-JS ולא ב-HTML: הקווים חייבים להיות מחושבים בין מרכזי
   הצמתים בפועל, אחרי שהדפדפן פרס אותם. גיאומטריה שנכתבת ידנית נשברת
   בכל שינוי גודל.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var core = document.getElementById('core');
  if (!core || document.querySelector('.hub-stage')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── אייקונים (זהים לשפה שכבר בעמוד) ── */
  var I = {
    ha:    '<path d="M3.5 10.4 12 3.4l8.5 7v9.2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"/><rect x="9.3" y="11.4" width="5.4" height="5.4" rx="1.4"/>',
    parts: '<rect x="4.5" y="3.5" width="15" height="17" rx="3"/><path d="M8.5 8.6h7M8.5 15.4h7"/><circle cx="15" cy="8.6" r="1.6" fill="currentColor" stroke="none"/><circle cx="9" cy="15.4" r="1.6" fill="currentColor" stroke="none"/>',
    net:   '<path d="M2.6 8.9a14.6 14.6 0 0 1 18.8 0"/><path d="M6 12.5a9.6 9.6 0 0 1 12 0"/><path d="M9.4 16.1a4.9 4.9 0 0 1 5.2 0"/><circle cx="12" cy="19.6" r="1.5" fill="currentColor" stroke="none"/>',
    scene: '<circle cx="11" cy="12.6" r="7.8"/><path d="M11 8.4v4.4l3 1.9"/><path d="M19.4 3.4v3.2M21 5h-3.2"/>',
    bulb:  '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
    blind: '<rect x="3" y="3.5" width="18" height="17" rx="2"/><path d="M3 8.6h18M3 13h18M3 17.4h18"/>',
    clima: '<path d="M3 8h13a3 3 0 1 0-3-3"/><path d="M3 14h16a3 3 0 1 1-3 3"/>',
    motion:'<circle cx="12" cy="12" r="3"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
    cam:   '<path d="M3 7.5h11v9H3z"/><path d="M14 11l7-3.5v9L14 13z"/>',
    lock:  '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'
  };
  function svg(d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  /* ── המפה: מיקומים באחוזים מתוך הבמה (16:10) ──
     x/y הם מרכז האלמנט. סודרו כך שאף כרטיס לא חופף לשכנו
     ושהקווים אף פעם לא חוצים צומת אחר.                          */
  var CORE = { x: 50, y: 50 };

  var PLATFORMS = [
    { id:'ha',    x:29,   y:26.5, icon:I.ha,    label:'Home&nbsp;Assistant' },
    { id:'parts', x:71,   y:26.5, icon:I.parts, label:'בקרים ורכיבים' },
    { id:'net',   x:24.5, y:73,   icon:I.net,   label:'רשת ותקשורת' },
    { id:'scene', x:75.5, y:73,   icon:I.scene, label:'סצנות ואוטומציות' }
  ];

  var DEVICES = [
    { p:'ha',    x:9.5,  y:11,   icon:I.bulb,   t:'תאורה אדריכלית',   d:'עמעום וגוני לבן לפי שעה' },
    { p:'parts', x:90.5, y:11,   icon:I.blind,  t:'תריסים וּוילונות',  d:'נסגרים בשיא החום' },
    { p:'parts', x:93,   y:41,   icon:I.clima,  t:'אקלים ומיזוג',      d:'מגיב לנוכחות בחדר' },
    { p:'net',   x:8,    y:44,   icon:I.motion, t:'חיישני נוכחות',     d:'זיהוי מקומי, בלי ענן' },
    { p:'net',   x:11,   y:90,   icon:I.cam,    t:'מצלמות IP',         d:'הקלטה בנכס, בלי מנוי' },
    { p:'scene', x:89,   y:90,   icon:I.lock,   t:'בקרת כניסה',        d:'קוד לאורח, יומן כניסות' }
  ];

  /* ── בניית ה-DOM ── */
  var wrap = document.createElement('div');
  wrap.className = 'hub-wrap';

  var pin = document.createElement('div');
  pin.className = 'hub-pin';

  var stage = document.createElement('div');
  stage.className = 'hub-stage';

  /* קווים */
  var NS = 'http://www.w3.org/2000/svg';
  var s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'hub-svg');
  s.setAttribute('preserveAspectRatio', 'none');
  s.innerHTML =
    '<defs><linearGradient id="hubLine" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#00D2FF" stop-opacity=".85"/>' +
    '<stop offset="1" stop-color="#2A72AD" stop-opacity=".55"/>' +
    '</linearGradient></defs>';
  stage.appendChild(s);

  /* ליבה */
  var coreEl = document.createElement('div');
  coreEl.className = 'hub-node hub-core';
  coreEl.style.left = CORE.x + '%';
  coreEl.style.top  = CORE.y + '%';
  coreEl.innerHTML =
    '<svg class="lg" viewBox="0 0 1069.703 145.19" role="img" aria-label="פלדמן מערכות"><use href="#fs-logo"></use></svg>' +
    '<span class="hub-core-cap">מחשב הבקרה</span>';
  stage.appendChild(coreEl);

  /* צמתי פלטפורמה */
  PLATFORMS.forEach(function (p) {
    var el = document.createElement('div');
    el.className = 'hub-node hub-plat';
    el.dataset.id = p.id;
    el.style.left = p.x + '%';
    el.style.top  = p.y + '%';
    el.innerHTML = svg(p.icon) + '<b>' + p.label + '</b>';
    stage.appendChild(el);
    p.el = el;
  });

  /* כרטיסי מכשיר */
  DEVICES.forEach(function (d) {
    var el = document.createElement('div');
    el.className = 'hub-node hub-dev';
    el.style.left = d.x + '%';
    el.style.top  = d.y + '%';
    el.innerHTML =
      '<span class="hub-dev-top"><span class="hub-dev-ic">' + svg(d.icon) + '</span>' +
      '<b>' + d.t + '</b></span><em>' + d.d + '</em>';
    stage.appendChild(el);
    d.el = el;
  });

  var bar = document.createElement('div');
  bar.className = 'hub-bar';
  bar.innerHTML = '<i></i>';

  pin.appendChild(stage);
  pin.appendChild(bar);
  wrap.appendChild(pin);

  /* ── החלפת התוכן של #core, בשמירה על הכותרת ── */
  var wrapEl = core.querySelector('.wrap') || core;
  var head   = wrapEl.querySelector('.head');
  var grid   = wrapEl.querySelector('.core-grid');
  if (grid) grid.remove();
  if (head) {
    head.classList.add('hub-head');
    pin.insertBefore(head, stage);   /* בתוך הנעיצה — אחרת נעלמת בגלילה */
  }
  wrapEl.appendChild(wrap);

  /* ── גיאומטריית הקווים ──
     מחושבת ממרכזי האלמנטים בפועל, בקואורדינטות הבמה. עקומה ריבועית
     שנקודת הבקרה שלה מוסטת בניצב לקו — זה מה שנותן את הקשת העדינה
     במקום קו ישר טכני.                                                */
  var paths = [];

  function centerOf(el, box) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
  }

  function curve(a, b, bend) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len, ny = dx / len;              /* ניצב לקו */
    return 'M' + a.x + ' ' + a.y + ' Q' + (mx + nx * bend) + ' ' + (my + ny * bend) +
           ' ' + b.x + ' ' + b.y;
  }

  function buildPaths() {
    paths.forEach(function (p) { p.node.remove(); });
    paths = [];
    var box = stage.getBoundingClientRect();
    if (!box.width) return;
    s.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);

    var c = centerOf(coreEl, box);

    PLATFORMS.forEach(function (p, i) {
      var pt = centerOf(p.el, box);
      var d = document.createElementNS(NS, 'path');
      d.setAttribute('d', curve(c, pt, i % 2 ? 26 : -26));
      s.appendChild(d);
      var L = d.getTotalLength();
      d.style.setProperty('--len', L);
      paths.push({ node: d, len: L, tier: 1, order: i });
    });

    DEVICES.forEach(function (dv, i) {
      var host = PLATFORMS.filter(function (p) { return p.id === dv.p; })[0];
      if (!host) return;
      var a = centerOf(host.el, box), b = centerOf(dv.el, box);
      var d = document.createElementNS(NS, 'path');
      d.setAttribute('d', curve(a, b, i % 2 ? 18 : -18));
      d.setAttribute('stroke-width', '1.3');
      s.appendChild(d);
      var L = d.getTotalLength();
      d.style.setProperty('--len', L);
      paths.push({ node: d, len: L, tier: 2, order: i });
    });
  }

  /* ── כוריאוגרפיה ──
     0.00–0.10  הליבה לבדה, נושמת
     0.10–0.45  ארבעת הקווים נמתחים והצמתים נכנסים, במדורג
     0.45–0.85  ששת הקווים המשניים והכרטיסים
     0.85–1.00  החזקה — הכל מחובר                                     */
  function seg(p, from, to) {
    return Math.max(0, Math.min(1, (p - from) / (to - from)));
  }

  function draw(p) {
    stage.style.setProperty('--p', p);

    paths.forEach(function (o) {
      var a, b;
      if (o.tier === 1) { a = 0.10 + o.order * 0.055; b = a + 0.13; }
      else              { a = 0.45 + o.order * 0.055; b = a + 0.13; }
      o.node.style.strokeDashoffset = o.len * (1 - seg(p, a, b));
    });

    PLATFORMS.forEach(function (pl, i) {
      var t = seg(p, 0.16 + i * 0.055, 0.16 + i * 0.055 + 0.12);
      pl.el.style.opacity = t;
      pl.el.style.transform = 'translate(-50%,-50%) scale(' + (0.72 + 0.28 * t) + ')';
    });

    DEVICES.forEach(function (dv, i) {
      var t = seg(p, 0.51 + i * 0.055, 0.51 + i * 0.055 + 0.12);
      dv.el.style.opacity = t;
      dv.el.style.transform = 'translate(-50%,-50%) translateY(' + (14 - 14 * t) + 'px)';
    });
  }

  /* ── בקר הגלילה הנעוצה ── */
  var mq = window.matchMedia('(min-width:1024px)');
  var ticking = false, travel = 0;

  function measure() {
    if (!mq.matches) { wrap.style.height = ''; return; }
    /* אורך המסלול: מספיק כדי שהכוריאוגרפיה תרגיש רגועה, אבל לא
       יותר משני מסכים — מעבר לזה זה מרגיש כמו שהעמוד נתקע.        */
    travel = Math.min(1500, window.innerHeight * 1.6);
    wrap.style.height = (pin.offsetHeight + travel) + 'px';
    buildPaths();
    onScroll();
  }

  function onScroll() {
    if (!mq.matches) {
      /* מובייל: הקו האנכי מתמלא לפי כמה מהעץ כבר נראה */
      var r = wrap.getBoundingClientRect();
      var vis = (window.innerHeight - r.top) / (r.height + window.innerHeight * .2);
      stage.style.setProperty('--p', Math.max(0, Math.min(1, vis)));
      return;
    }
    var rect = wrap.getBoundingClientRect();
    var p = -rect.top / travel;
    draw(Math.max(0, Math.min(1, p)));
  }

  /* ── מובייל: אותו תוכן, שדרה אנכית ── */
  var mobileBuilt = false;
  function buildMobile() {
    if (mobileBuilt) return;
    mobileBuilt = true;
    var line = document.createElement('div');
    line.className = 'hub-mline';
    PLATFORMS.forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'hub-mrow';
      row.appendChild(p.el);
      var devs = document.createElement('div');
      devs.className = 'hub-mdevs';
      DEVICES.filter(function (d) { return d.p === p.id; })
             .forEach(function (d) { devs.appendChild(d.el); });
      row.appendChild(devs);
      line.appendChild(row);
    });
    stage.appendChild(line);
  }

  function sync() {
    if (mq.matches) {
      measure();
    } else {
      buildMobile();
      PLATFORMS.concat(DEVICES).forEach(function (n) {
        n.el.style.opacity = ''; n.el.style.transform = '';
      });
      wrap.style.height = '';
    }
  }

  if (reduce) {
    buildMobile();
  } else {
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', sync, { passive: true });
    if (mq.addEventListener) mq.addEventListener('change', sync);
    window.addEventListener('load', sync);
    sync();
  }
})();
