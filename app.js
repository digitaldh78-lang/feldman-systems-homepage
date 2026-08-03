/* ══════════════════════════════════════════════════
   FELDMAN SYSTEMS — interactions
   Vanilla JS · no dependencies · prefers-reduced-motion honoured
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var deskHover = window.matchMedia('(hover: hover) and (min-width: 1000px)').matches;

  /* position:sticky silently dies if ANY ancestor is a scroll container.
     Host themes (WoodMart) set overflow:hidden on <html> and on page wrappers,
     which is exactly what broke the pinned steps section. Walk up from the
     section and swap `hidden` for `clip` — same overflow protection, but it
     does not create a scroll container. */
  function unclipAncestors(el) {
    try {
      var n = el;
      while (n && n !== document.documentElement) {
        n = n.parentElement;
        if (!n) break;
        var cs = window.getComputedStyle(n);
        if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden') {
          n.style.setProperty('overflow', 'visible', 'important');
          n.style.setProperty('overflow-x', 'clip', 'important');
        }
      }
      document.documentElement.style.setProperty('overflow-x', 'clip', 'important');
      document.documentElement.style.setProperty('overflow-y', 'visible', 'important');
    } catch (e) {}
  }

  /* ── year ── */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── sticky nav + scroll progress + active link ── */
  var nav = document.getElementById('nav');
  var bar = document.getElementById('progress');
  var secs = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('on', y > 12);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    // active nav link
    var cur = null;
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= 140 && r.bottom > 140) { cur = secs[i].id; break; }
    }
    links.forEach(function (a) {
      a.classList.toggle('cur', cur && a.getAttribute('href') === '#' + cur);
    });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ── mobile nav ── */
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('open')) {
        mnav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ── scroll reveal, staggered ── */
  var rvs = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var explicit = el.getAttribute('data-d');
        var idx;
        if (explicit !== null) {
          idx = parseInt(explicit, 10) || 0;
        } else {
          var p = el.parentElement;
          var sib = p ? Array.prototype.filter.call(p.children, function (c) {
            return c.classList && c.classList.contains('rv');
          }) : [];
          idx = Math.max(0, sib.indexOf(el));
        }
        setTimeout(function () { el.classList.add('in'); }, Math.min(idx, 8) * 90);
        io.unobserve(el);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -40px 0px' });
    rvs.forEach(function (el) { io.observe(el); });

    /* safety net: anchor jumps / fast scrolling can skip past elements
       before the observer evaluates them. Reveal anything already at or
       above the fold so no section is ever left invisible. */
    var sweeping = false;
    function sweep() {
      var left = 0;
      rvs.forEach(function (el) {
        if (el.classList.contains('in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
          el.classList.add('in');
          io.unobserve(el);
        } else { left++; }
      });
      sweeping = false;
      if (!left) window.removeEventListener('scroll', onSweep);
    }
    function onSweep() {
      if (sweeping) return;
      sweeping = true;
      requestAnimationFrame(sweep);
    }
    window.addEventListener('scroll', onSweep, { passive: true });
    window.addEventListener('load', function () { setTimeout(sweep, 400); });
  }

  /* ── count-up numbers ── */
  var nums = document.querySelectorAll('[data-num]');
  if (nums.length) {
    if (reduce) {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-num') + '+'; });
    } else {
      var nio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var target = parseInt(el.getAttribute('data-num'), 10) || 0;
          var dur = 1500, t0 = null;
          function loop(t) {
            if (t0 === null) t0 = t;
            var p = Math.min((t - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + (p === 1 ? '+' : '');
            if (p < 1) requestAnimationFrame(loop);
          }
          requestAnimationFrame(loop);
          nio.unobserve(el);
        });
      }, { threshold: 0.6 });
      nums.forEach(function (n) { nio.observe(n); });
    }
  }

  /* ── hero parallax (controller + nodes) ── */
  var pars = document.querySelectorAll('[data-par]');
  if (pars.length && !reduce && window.matchMedia('(min-width: 1000px)').matches) {
    var pTick = false;
    function applyPar() {
      var y = window.scrollY;
      pars.forEach(function (el) {
        var rate = parseFloat(el.getAttribute('data-par')) || 0;
        el.style.transform = 'translate3d(0,' + (y * rate).toFixed(2) + 'px,0)';
      });
      pTick = false;
    }
    window.addEventListener('scroll', function () {
      if (pTick) return;
      pTick = true;
      requestAnimationFrame(applyPar);
    }, { passive: true });
  }

  /* ── mega menus (multiple) ── */
  var megas = Array.prototype.slice.call(document.querySelectorAll('.has-fsmega'));
  if (megas.length) {
    var openMega = null;
    var megaTimer = null;

    function setMega(host, open) {
      var trig = host.querySelector('.fsmega-trig');
      var panel = host.querySelector('.fsmega');
      if (!trig || !panel) return;
      trig.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      panel.classList.toggle('open', open);
      openMega = open ? host : (openMega === host ? null : openMega);
    }
    function closeAll() {
      megas.forEach(function (h) { setMega(h, false); });
      openMega = null;
    }

    megas.forEach(function (host) {
      var trig = host.querySelector('.fsmega-trig');
      var panel = host.querySelector('.fsmega');
      if (!trig || !panel) return;

      trig.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = openMega === host;
        closeAll();
        if (!isOpen) setMega(host, true);
      });

      if (deskHover) {
        host.addEventListener('mouseenter', function () {
          clearTimeout(megaTimer);
          if (openMega && openMega !== host) setMega(openMega, false);
          setMega(host, true);
        });
        host.addEventListener('mouseleave', function () {
          megaTimer = setTimeout(function () { setMega(host, false); }, 160);
        });
      }

      panel.addEventListener('click', function (e) {
        if (e.target.closest('a')) closeAll();
      });
    });

    document.addEventListener('click', function (e) {
      if (openMega && !e.target.closest('.has-fsmega')) closeAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openMega) {
        var t = openMega.querySelector('.fsmega-trig');
        closeAll();
        if (t) t.focus();
      }
    });
  }

  /* ── expanding solutions gallery ── */
  var gal = document.getElementById('gal');
  if (gal) {
    var panels = Array.prototype.slice.call(gal.querySelectorAll('.gp'));
    function openPanel(p) {
      panels.forEach(function (x) {
        var on = x === p;
        x.classList.toggle('is-open', on);
        x.setAttribute('aria-expanded', String(on));
      });
    }
    panels.forEach(function (p) {
      p.addEventListener('click', function (e) {
        /* let the CTA link inside an open panel navigate normally */
        if (e.target.closest('.gp-more')) return;
        openPanel(p);
      });
      if (deskHover) {
        p.addEventListener('mouseenter', function () { openPanel(p); });
      }
      p.addEventListener('focus', function () { openPanel(p); });
      /* role="button" divs need explicit Enter/Space handling */
      p.addEventListener('keydown', function (e) {
        if (e.target !== p) return;
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          openPanel(p);
        }
      });
    });

    /* ── מובייל: הגלריה ננעצת והכרטיסים מתחלפים בגלילה ──
       מגיעים לאזור — הראשון כבר פתוח. כל גלילה סוגרת אחד ופותחת
       את הבא, עד האחרון, ואז הסקשן משחרר וממשיכים הלאה.
       בדסקטופ לא נוגעים: שם ההתנהגות נשארת hover.                 */
    var gmq = window.matchMedia('(max-width:900px)');
    var gReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!gReduce) {
      var gWrap = document.createElement('div');
      var gPin  = document.createElement('div');
      gPin.className = 'gal-pin';
      gal.parentNode.insertBefore(gWrap, gal);
      gWrap.appendChild(gPin);
      gPin.appendChild(gal);

      var steps = document.createElement('div');
      steps.className = 'gal-steps';
      panels.forEach(function () { steps.appendChild(document.createElement('i')); });
      gPin.appendChild(steps);

      var gTravel = 0, gTick = false, gLockUntil = 0, gLast = -1;

      /* נגיעה ידנית מנצחת לרגע — אחרת הכרטיס שהמשתמש פתח היה
         "קופץ" חזרה בפריים הבא והתחושה שבורה. */
      panels.forEach(function (p) {
        p.addEventListener('click', function () { gLockUntil = Date.now() + 1600; });
      });

      function gStickyTop() {
        return parseFloat(window.getComputedStyle(gPin).top) || 0;
      }

      function gMeasure() {
        if (!gmq.matches) { gWrap.style.height = ''; return; }
        gTravel = panels.length * 170;          /* ~תנועת אגודל אחת לכל כרטיס */
        gWrap.style.height = (gPin.offsetHeight + gTravel + gStickyTop()) + 'px';
        gScroll();
      }

      function gScroll() {
        if (!gmq.matches) return;
        if (Date.now() < gLockUntil) return;
        var r = gWrap.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (gStickyTop() - r.top) / gTravel));
        var i = Math.min(panels.length - 1, Math.floor(p * panels.length));
        if (i === gLast) return;
        gLast = i;
        openPanel(panels[i]);
        Array.prototype.forEach.call(steps.children, function (dot, k) {
          dot.classList.toggle('on', k === i);
        });
      }

      window.addEventListener('scroll', function () {
        if (gTick) return;
        gTick = true;
        requestAnimationFrame(function () { gScroll(); gTick = false; });
      }, { passive: true });
      window.addEventListener('resize', gMeasure, { passive: true });
      if (gmq.addEventListener) gmq.addEventListener('change', function () { gLast = -1; gMeasure(); });
      window.addEventListener('load', gMeasure);
      gMeasure();
    }
  }

  /* ── accordion (single-open) ── */
  var items = Array.prototype.slice.call(document.querySelectorAll('.ai'));
  items.forEach(function (it) {
    var btn = it.querySelector('.ab');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var wasOpen = it.classList.contains('open');
      items.forEach(function (o) {
        o.classList.remove('open');
        var b = o.querySelector('.ab');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        it.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── process rail: scroll-linked fill, 0 → 100% as it crosses the viewport ── */
  var rail = document.getElementById('rail');
  if (rail && !reduce) {
    var steps = Array.prototype.slice.call(rail.querySelectorAll('.rs'));
    var head = document.createElement('span');
    head.className = 'rail-head';
    head.setAttribute('aria-hidden', 'true');
    rail.appendChild(head);

    var rTick = false;
    function drawRail() {
      var r = rail.getBoundingClientRect();
      var vh = window.innerHeight;
      /* start when the rail's top reaches 78% of the viewport,
         finish once it has travelled past 32% — a comfortable read pace */
      var start = vh * 0.78, end = vh * 0.32;
      var p = (start - r.top) / (start - end);
      p = Math.max(0, Math.min(1, p));

      rail.style.setProperty('--p', p.toFixed(4));
      rail.classList.toggle('live', p > 0.01 && p < 0.995);

      /* light each node as the line reaches it */
      var n = steps.length;
      steps.forEach(function (s, i) {
        s.classList.toggle('on', p >= (i + 0.55) / n);
      });
      rTick = false;
    }
    window.addEventListener('scroll', function () {
      if (rTick) return;
      rTick = true;
      requestAnimationFrame(drawRail);
    }, { passive: true });
    window.addEventListener('resize', drawRail, { passive: true });
    drawRail();
  }

  /* ── magnetic buttons ── */
  if (deskHover && !reduce) {
    document.querySelectorAll('.mag').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (x * 0.14).toFixed(2) + 'px,' + (y * 0.2 - 3).toFixed(2) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ── card 3D tilt ── */
  if (deskHover && !reduce) {
    document.querySelectorAll('.cc, .ac, .mc').forEach(function (c) {
      var raf = null;
      c.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = c.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = 'translateY(-8px) perspective(1000px) rotateX(' +
            (-py * 4).toFixed(2) + 'deg) rotateY(' + (px * 4).toFixed(2) + 'deg)';
          raf = null;
        });
      });
      c.addEventListener('mouseleave', function () { c.style.transform = ''; });
    });
  }

  /* ── scroll-pinned 3-step section ── */
  var track = document.getElementById('stepsTrack');
  if (track) {
    unclipAncestors(track);
    var panes = Array.prototype.slice.call(track.querySelectorAll('.step-pane'));
    var figs  = Array.prototype.slice.call(track.querySelectorAll('.step-fig'));
    var nums  = Array.prototype.slice.call(track.querySelectorAll('.steps-nums li'));
    var total = panes.length;
    var cur = -1, sTick = false;

    function setStep(i) {
      if (i === cur) return;
      cur = i;
      panes.forEach(function (p, n) { p.classList.toggle('on', n === i); });
      figs.forEach(function (f, n) { f.classList.toggle('on', n === i); });
      nums.forEach(function (l, n) {
        l.classList.toggle('on', n === i);
        l.classList.toggle('done', n < i);
      });
    }

    function drawSteps() {
      var r = track.getBoundingClientRect();
      var scrollable = r.height - window.innerHeight;
      if (scrollable <= 0) { setStep(0); sTick = false; return; }
      var p = Math.max(0, Math.min(0.9999, -r.top / scrollable));
      setStep(Math.floor(p * total));
      sTick = false;
    }
    window.addEventListener('scroll', function () {
      if (sTick) return;
      sTick = true;
      requestAnimationFrame(drawSteps);
    }, { passive: true });
    window.addEventListener('resize', drawSteps, { passive: true });
    drawSteps();
  }

  /* ── knowledge centre tabs ── */
  var kcTabs = document.querySelectorAll('.kc-tab');
  if (kcTabs.length) {
    Array.prototype.forEach.call(kcTabs, function (tab) {
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(kcTabs, function (t) {
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          var on = (t === tab);
          t.classList.toggle('is-on', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          if (panel) {
            panel.hidden = !on;
            /* replay the reveal so the incoming cards animate in rather than
               appearing already-faded from a stale observer pass */
            if (on) Array.prototype.forEach.call(panel.querySelectorAll('.rv'), function (el) {
              el.classList.remove('in');
              requestAnimationFrame(function () { el.classList.add('in'); });
            });
          }
        });
      });
    });
  }

  /* ── showreel: YouTube facade — iframe only loads on click ── */
  var facade = document.getElementById('reelFacade');
  if (facade) {
    /* play-shaped cursor that tracks the pointer inside the video frame,
       so it reads as a video and not a static image */
    var frame  = facade.closest('.reel-frame');
    var cursor = document.getElementById('reelCursor');
    if (frame && cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      /* The frame's box is cached instead of measured on every pointermove —
         getBoundingClientRect() forces layout, and doing that per move is what
         makes a follow-cursor feel gritty. Invalidated on scroll/resize. */
      var rect = null, rafId = 0, cx = 0, cy = 0;

      function place() {
        rafId = 0;
        cursor.style.setProperty('--cx', cx + 'px');
        cursor.style.setProperty('--cy', cy + 'px');
      }
      function track(e) {
        if (!rect) rect = frame.getBoundingClientRect();
        /* clientLeft/Top = the frame's border widths. The badge is positioned
           against the padding box, so without this it sits 1px off the pointer. */
        cx = e.clientX - rect.left - frame.clientLeft;
        cy = e.clientY - rect.top - frame.clientTop;
        if (!rafId) rafId = requestAnimationFrame(place);
      }
      function drop() { rect = null; }

      frame.addEventListener('pointerenter', function (e) {
        rect = frame.getBoundingClientRect();
        /* clientLeft/Top = the frame's border widths. The badge is positioned
           against the padding box, so without this it sits 1px off the pointer. */
        cx = e.clientX - rect.left - frame.clientLeft;
        cy = e.clientY - rect.top - frame.clientTop;
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        place();                       /* land under the pointer, then fade in */
        frame.classList.add('cur-on');
      });
      frame.addEventListener('pointermove', track, { passive: true });
      frame.addEventListener('pointerleave', function () {
        frame.classList.remove('cur-on');
      });
      window.addEventListener('scroll', drop, { passive: true });
      window.addEventListener('resize', drop, { passive: true });
    }

    facade.addEventListener('click', function () {
      var id = facade.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id +
              '?autoplay=1&rel=0&modestbranding=1&playsinline=1&hl=he';
      f.title = 'פלדמן מערכות — בית חכם בפעולה';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('loading', 'lazy');
      facade.replaceWith(f);
      var cap = document.querySelector('.reel-cap');
      if (cap) cap.remove();
      var cur = document.getElementById('reelCursor');
      if (cur) cur.remove();
      if (frame) frame.classList.remove('cur-on');
    });
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   סרגל תחתון במובייל + פרטי הפוטר
   ───────────────────────────────────────────────────────────────────────────
   נבנה כאן ולא ב-HTML כי סימן ה-markup של העמוד יושב בוורדפרס, ואילו הקובץ
   הזה נטען מ-GitHub Pages ומתעדכן בפריסה אחת. כשעיצוב המובייל יינעל כדאי
   להעביר את הבלוקים האלה ל-HTML של העמוד עצמו — במיוחד את הכתובת, שחשובה
   ל-SEO מקומי. עד אז זו הדרך המהירה והבטוחה לעדכן.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  /* ── noindex לעמוד הסקיצה ──────────────────────────────────────────────
     באתר לא מותקן תוסף SEO, אז אין דרך להוסיף את התגית בצד השרת. גוגל כן
     מריץ JS ומכבד תגית robots שנוספת בזמן רינדור, אז זה עובד — אבל זה אות
     ברמת הדפדפן ולא ברמת ה-HTML הגולמי. הדרך האטומה היא תוסף SEO או להגדיר
     את העמוד כמוגן בסיסמה. מוגבל רק לעמוד התצוגה, לא לכל האתר. */
  if (/%d7%aa%d7%a6%d7%95%d7%92%d7%94-%d7%9c%d7%9c%d7%a7%d7%95%d7%97/i.test(location.pathname) ||
      /תצוגה-ללקוח/.test(decodeURIComponent(location.pathname))) {
    if (!document.querySelector('meta[name="robots"]')) {
      var rb = document.createElement('meta');
      rb.name = 'robots';
      rb.content = 'noindex, nofollow, noarchive';
      document.head.appendChild(rb);
    }
  }

  /* ה-IIFE הזה נפרד מזה שלמעלה, אז reduce לא בתחום ההכרזה שלו — מגדיר מחדש */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA   = 'https://wa.me/972544777238';
  var WAZE = 'https://waze.com/ul?q=' + encodeURIComponent('הרב קוק 48 בני ברק') + '&navigate=yes';
  var ic = {
    shop : '<path d="M3 8l1.8-4h14.4L21 8M4 8v12h16V8M9.5 20v-6h5v6"/>',
    cart : '<path d="M6.5 6H21l-1.6 8H8L6.5 6zM6.5 6 5.6 3H2.5"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="18" cy="19" r="1.4"/>',
    heart: '<path d="M12 20.2s-7.2-4.6-7.2-9.7A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.2 2.5c0 5.1-7.2 9.7-7.2 9.7z"/>',
    menu : '<path d="M4 7h16M4 12h16M4 17h16"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail : '<path d="M4 5h16v14H4zM4 6.2l8 6 8-6"/>',
    pin  : '<path d="M12 22s7-6.2 7-11.2a7 7 0 1 0-14 0C5 15.8 12 22 12 22z"/><circle cx="12" cy="10.5" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.2 2"/>'
  };
  var waPath = '<path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-4-3.5c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-1-2.2c-.2-.6-.4-.5-.6-.5h-.6c-.2 0-.5.1-.8.4-.9.9-1.1 2-.8 3.2.4 1.4 1.3 2.7 1.5 2.9.2.2 2.5 3.9 6.1 5.3 2.2.9 3.1.9 4.2.8.7-.1 2-.8 2.2-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.6-.4z"/><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20z"/>';
  var svg = function (p, filled) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (filled ? ' class="fill"' : '') + '>' + p + '</svg>';
  };

  /* ── 1. הסרגל התחתון ── */
  if (!document.querySelector('.tabbar')) {
    var bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.setAttribute('aria-label', 'ניווט מהיר');
    bar.innerHTML =
      '<a href="/shop/">'     + svg(ic.shop)  + '<span>חנות</span></a>' +
      '<a href="/cart/">'     + svg(ic.cart)  + '<span>עגלה</span></a>' +
      '<a href="/wishlist/">' + svg(ic.heart) + '<span>מועדפים</span></a>' +
      '<a href="' + WA + '" target="_blank" rel="noopener">' + svg(waPath, true) + '<span>וואטסאפ</span></a>' +
      '<button type="button" class="tb-menu" aria-label="פתיחת תפריט">' + svg(ic.menu) + '<span>תפריט</span></button>';
    document.body.appendChild(bar);

    /* כפתור התפריט מפעיל את אותו burger שכבר קיים — מקור אמת אחד למצב פתוח/סגור */
    var burger = document.getElementById('burger');
    var tbMenu = bar.querySelector('.tb-menu');
    if (burger && tbMenu) {
      tbMenu.addEventListener('click', function () {
        burger.click();
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
  }

  /* ── 2. פרטי הקשר בפוטר — אייקונים, כתובת אחת שלא נשברת, וניווט ── */
  var cols = document.querySelectorAll('.ft-col');
  var contact = cols.length ? cols[cols.length - 1] : null;
  if (contact && !contact.querySelector('.ft-c')) {
    contact.innerHTML =
      '<h4>יצירת קשר</h4>' +
      '<div class="ft-c">' + svg(ic.phone) +
        '<div><b>טלפון</b><a href="tel:0544777238" dir="ltr">054-477-7238</a></div></div>' +
      '<div class="ft-c">' + svg(ic.mail) +
        '<div><b>דוא״ל</b><a href="mailto:info@feldman-systems.co.il">info@feldman-systems.co.il</a></div></div>' +
      '<div class="ft-c">' + svg(ic.pin) +
        '<div><b>כתובת</b><span class="ft-addr">בני ברק, הרב קוק 48</span>' +
        '<a class="ft-waze" href="' + WAZE + '" target="_blank" rel="noopener">ניווט עם Waze ←</a></div></div>' +
      '<div class="ft-c">' + svg(ic.clock) +
        '<div><b>שעות פעילות</b><span>א׳–ה׳ · 09:00–18:00</span>' +
        '<span class="ft-closed">שישי ושבת — סגור</span></div></div>';
  }

  /* ── 3. הקישורים המשפטיים + קרדיט ── */
  var legal = document.querySelector('.ft-legal');
  if (legal) {
    var urls = {
      'מדיניות פרטיות': '/מדיניות-פרטיות-2/',
      'תנאי שימוש'    : '/תנאי-שימוש-2/',
      'הצהרת נגישות'  : '/הצהרת-נגישות-2/'
    };
    legal.querySelectorAll('a').forEach(function (a) {
      var u = urls[a.textContent.trim()];
      if (u) a.setAttribute('href', u);
    });
  }
  var bot = document.querySelector('.ft-bot');
  if (bot && !bot.querySelector('.ft-credit')) {
    var cr = document.createElement('span');
    cr.className = 'ft-credit';
    cr.innerHTML = 'נבנה והוצב על ידי <a href="https://dhdigital.co.il" target="_blank" rel="noopener">DH&nbsp;Digital</a>';
    bot.appendChild(cr);
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   שורת החנות — גלילה אופקית נעוצה (מובייל בלבד)
   ───────────────────────────────────────────────────────────────────────────
   מגיעים לסקשן, הוא נעצר, וכשממשיכים לגלול הכרטיסים נעים מימין לשמאל עד
   האחרון — ואז הגלילה ממשיכה רגיל.

   שתי החלטות שמונעות את התחושה ש"הדף תקוע", וזה הסיכון האמיתי של האפקט הזה
   במובייל:

   1. אני מזיז scrollLeft ולא transform. המשמעות: המחווה הטבעית של החלקה
      באצבע ממשיכה לעבוד בדיוק כמו קודם, כי זו אותה גלילה. ברגע שהמשתמש נוגע —
      אני משחרר את ההגה ולא נלחם בו יותר.
   2. מרחק הנעיצה מקוצר לכחצי מהמרחק האופקי ומוגבל לגובה מסך אחד. בלי זה
      היו נדרשים ~1,500px של גלילה אנכית כדי לעבור שישה כרטיסים.

   ה-RTL כאן לא טריוויאלי: בכיוון ימין-לשמאל scrollLeft מתחיל ב-0 ויורד
   לערכים שליליים. במקום להניח, אני מודד את הקצה בזמן ריצה.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  var grid = document.querySelector('#shop .prod-grid');
  if (!grid) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mq     = window.matchMedia('(max-width: 760px)');
  var pin = null, inner = null, fill = null, driving = true, ticking = false;

  /* קצה הגלילה האופקית — חיובי ב-LTR, שלילי ב-RTL. נמדד, לא מונח. */
  function edge(el) {
    var keep = el.scrollLeft;
    el.scrollLeft = -99999; var lo = el.scrollLeft;
    el.scrollLeft =  99999; var hi = el.scrollLeft;
    el.scrollLeft = keep;
    return lo < 0 ? lo : hi;
  }

  function build() {
    if (pin) return;
    pin   = document.createElement('div'); pin.className = 'hpin';
    inner = document.createElement('div'); inner.className = 'hpin-in';
    var bar = document.createElement('div'); bar.className = 'hpin-bar';
    fill = document.createElement('i');
    bar.appendChild(fill);

    grid.parentNode.insertBefore(pin, grid);
    inner.appendChild(grid);
    inner.appendChild(bar);
    pin.appendChild(inner);

    /* הרגע שבו המשתמש לוקח שליטה — מפסיקים לנהוג */
    grid.addEventListener('touchstart', function () { driving = false; }, { passive: true });
    grid.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') driving = false;
    }, { passive: true });

    measure();
  }

  function teardown() {
    if (!pin) return;
    pin.parentNode.insertBefore(grid, pin);
    pin.remove();
    pin = null; inner = null; fill = null; driving = true;
    grid.style.removeProperty('scroll-snap-type');
  }

  function measure() {
    if (!pin) return;
    var hDist = grid.scrollWidth - grid.clientWidth;
    if (hDist < 40) { pin.style.height = 'auto'; return; }
    var travel = Math.min(hDist * 0.5, window.innerHeight * 0.9);
    pin.style.height = (inner.offsetHeight + travel) + 'px';
    draw();
  }

  function draw() {
    ticking = false;
    if (!pin) return;
    var r = pin.getBoundingClientRect();
    var travel = pin.offsetHeight - inner.offsetHeight;
    if (travel <= 0) return;

    var p = Math.max(0, Math.min(1, -r.top / travel));
    if (fill) fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';

    if (driving && !reduce) {
      /* snap כופה נלחם בהצבה ידנית של scrollLeft — מכבים אותו כל עוד אנחנו נוהגים */
      if (grid.style.scrollSnapType !== 'none') grid.style.scrollSnapType = 'none';
      grid.scrollLeft = p * edgeCache;
    } else if (grid.style.scrollSnapType === 'none') {
      grid.style.removeProperty('scroll-snap-type');
    }
  }

  var edgeCache = 0;
  function sync() {
    if (mq.matches) { build(); edgeCache = edge(grid); measure(); }
    else            { teardown(); }
  }

  window.addEventListener('scroll', function () {
    if (ticking || !pin) return;
    ticking = true; requestAnimationFrame(draw);
  }, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  if (mq.addEventListener) mq.addEventListener('change', sync);
  window.addEventListener('load', sync);
  sync();
})();

/* ═══════════════════════════════════════════════════════════════════════════
   שלב 01 בפס התהליך — תמונה ייעודית במקום כפילות של ההירו
   ───────────────────────────────────────────────────────────────────────────
   הכרטיס טען את feldman-hero-wide, בדיוק אותו קובץ של ההירו, וזה נראה כמו
   טעות. הוחלף בצילום של שיחת האפיון עצמה. index.html כבר מעודכן; ההחלפה כאן
   קיימת כי ה-markup החי יושב בעמוד הוורדפרס ולא בקובץ.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  var img = document.querySelector('.step-fig img');
  if (!img || !/feldman-hero-wide/.test(img.getAttribute('src') || '')) return;
  var U = '/wp-content/uploads/2026/08/feldman-step1-discovery-plans';
  img.setAttribute('src', U + '-768x579.jpg');
  img.setAttribute('srcset', U + '-768x579.jpg 768w, ' + U + '.jpg 1760w');
  img.setAttribute('width', '1760');
  img.setAttribute('height', '1328');
  img.setAttribute('alt', 'יועץ ובעלי נכס מסמנים על תוכניות אדריכליות, לצדם טאבלט עם תרשים המערכת');
})();

/* ═══════════════════════════════════════════════════════════════════════════
   סקשן אודות — תמונת קובי החדשה
   ───────────────────────────────────────────────────────────────────────────
   הישנה (feldman-kobi-portrait) צולמה בחניון עם רכב ברקע ולא התאימה לסקשן.
   הוחלפה בתמונה של קובי מול וילה מוארת עם דשבורד קריא על הטאבלט.
   index.html כבר מעודכן; ההחלפה כאן קיימת כי ה-markup החי יושב בעמוד
   הוורדפרס ולא בקובץ.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  var img = document.querySelector('#about .fig img');
  if (!img || !/feldman-kobi-portrait/.test(img.getAttribute('src') || '')) return;
  var U = '/wp-content/uploads/2026/08/kobi-about-new';
  img.setAttribute('src', U + '.jpg');
  img.setAttribute('srcset', U + '-768x576.jpg 768w, ' + U + '.jpg 1448w');
  img.setAttribute('sizes', '(max-width:760px) 92vw, 44vw');
  img.setAttribute('width', '1448');
  img.setAttribute('height', '1086');
  img.setAttribute('alt', 'קובי ניסן פלדמן, מייסד פלדמן מערכות, מחזיק טאבלט עם דשבורד בית חכם מול וילה מוארת');
})();


/* ═══════════════════════════════════════════════════════════════════════════
   רכזת מחשב הבקרה — בנייה + כוריאוגרפיית גלילה
   ───────────────────────────────────────────────────────────────────────────
   מחליף את תוכן #core בבמה רדיאלית, בדסקטופ ובמובייל כאחד.

   למה הכל נבנה מ-JS: הקווים חייבים להיות מחושבים בין מרכזי הצמתים בפועל,
   אחרי שהדפדפן פרס אותם. גיאומטריה שנכתבת ידנית נשברת בכל שינוי גודל.

   ההבדל בין המצבים הוא רק בטבלת המיקומים ובשאלה איפה יושבים כרטיסי
   המכשיר — לא בשני עצים נפרדים. במובייל שלוש טבעות לא נכנסות ל-345px,
   ולכן המכשירים יורדים לרשת דו-טורית מתחת לרכזת ונחשפים בסוף האנימציה.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var core = document.getElementById('core');
  if (!core || document.querySelector('.hub-stage')) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mq     = window.matchMedia('(min-width:1024px)');

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
  function svg(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; }

  /* x/y = מיקום המרכז באחוזי הבמה. d* = דסקטופ, m* = מובייל.
     במובייל הבמה ריבועית והצמתים קטנים, ולכן הרדיוס שונה.        */
  var PLATFORMS = [
    { id:'ha',    dx:29,   dy:26.5, mx:23, my:23, icon:I.ha,    label:'Home&nbsp;Assistant' },
    { id:'parts', dx:71,   dy:26.5, mx:77, my:23, icon:I.parts, label:'בקרים ורכיבים' },
    { id:'net',   dx:24.5, dy:73,   mx:23, my:77, icon:I.net,   label:'רשת ותקשורת' },
    { id:'scene', dx:75.5, dy:73,   mx:77, my:77, icon:I.scene, label:'סצנות ואוטומציות' }
  ];

  var DEVICES = [
    { p:'ha',    dx:9.5,  dy:11, icon:I.bulb,   t:'תאורה אדריכלית',  d:'עמעום וגוני לבן לפי שעה' },
    { p:'parts', dx:90.5, dy:11, icon:I.blind,  t:'תריסים וּוילונות', d:'נסגרים בשיא החום' },
    { p:'parts', dx:93,   dy:41, icon:I.clima,  t:'אקלים ומיזוג',     d:'מגיב לנוכחות בחדר' },
    { p:'net',   dx:8,    dy:44, icon:I.motion, t:'חיישני נוכחות',    d:'זיהוי מקומי, בלי ענן' },
    { p:'net',   dx:11,   dy:90, icon:I.cam,    t:'מצלמות IP',        d:'הקלטה בנכס, בלי מנוי' },
    { p:'scene', dx:89,   dy:90, icon:I.lock,   t:'בקרת כניסה',       d:'קוד לאורח, יומן כניסות' }
  ];

  /* ── DOM ── */
  var wrap  = document.createElement('div'); wrap.className = 'hub-wrap';
  var pin   = document.createElement('div'); pin.className  = 'hub-pin';
  var stage = document.createElement('div'); stage.className = 'hub-stage';
  var grid  = document.createElement('div'); grid.className  = 'hub-grid';

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

  var coreEl = document.createElement('div');
  coreEl.className = 'hub-node hub-core';
  coreEl.style.left = '50%';
  coreEl.style.top  = '50%';
  coreEl.innerHTML =
    '<svg class="lg" viewBox="0 0 1069.703 145.19" role="img" aria-label="פלדמן מערכות"><use href="#fs-logo"></use></svg>' +
    '<span class="hub-core-cap">מחשב הבקרה</span>';
  stage.appendChild(coreEl);

  PLATFORMS.forEach(function (p) {
    var el = document.createElement('div');
    el.className = 'hub-node hub-plat';
    el.innerHTML = svg(p.icon) + '<b>' + p.label + '</b>';
    stage.appendChild(el);
    p.el = el;
  });

  DEVICES.forEach(function (d) {
    var el = document.createElement('div');
    el.className = 'hub-node hub-dev';
    el.innerHTML =
      '<span class="hub-dev-top"><span class="hub-dev-ic">' + svg(d.icon) + '</span>' +
      '<b>' + d.t + '</b></span><em>' + d.d + '</em>';
    d.el = el;
  });

  var bar = document.createElement('div');
  bar.className = 'hub-bar';
  bar.innerHTML = '<i></i>';

  pin.appendChild(stage);
  pin.appendChild(grid);
  pin.appendChild(bar);
  wrap.appendChild(pin);

  var wrapEl = core.querySelector('.wrap') || core;
  var head   = wrapEl.querySelector('.head');
  var oldGrid = wrapEl.querySelector('.core-grid');
  if (oldGrid) oldGrid.remove();
  if (head) { head.classList.add('hub-head'); pin.insertBefore(head, stage); }
  wrapEl.appendChild(wrap);

  /* ── מיקום הצמתים לפי המצב ── */
  var isDesk = null;
  function place() {
    var desk = mq.matches;
    if (desk === isDesk) return false;
    isDesk = desk;

    PLATFORMS.forEach(function (p) {
      p.el.style.left = (desk ? p.dx : p.mx) + '%';
      p.el.style.top  = (desk ? p.dy : p.my) + '%';
    });

    DEVICES.forEach(function (d) {
      if (desk) {
        d.el.style.left = d.dx + '%';
        d.el.style.top  = d.dy + '%';
        stage.appendChild(d.el);
      } else {
        /* ברשת הן זורמות — הקואורדינטות הרדיאליות חייבות ליפול,
           אחרת position:static + left:9% הופך להיסט אמיתי.        */
        d.el.style.left = '';
        d.el.style.top  = '';
        grid.appendChild(d.el);
      }
    });
    return true;
  }

  /* ── גיאומטריית הקווים ── */
  var paths = [];
  function centerOf(el, box) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
  }
  function curve(a, b, bend) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    return 'M' + a.x + ' ' + a.y +
           ' Q' + (mx + (-dy / len) * bend) + ' ' + (my + (dx / len) * bend) +
           ' ' + b.x + ' ' + b.y;
  }

  function buildPaths() {
    paths.forEach(function (o) { o.node.remove(); });
    paths = [];
    var box = stage.getBoundingClientRect();
    if (!box.width) return;
    s.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    var c = centerOf(coreEl, box);
    var desk = mq.matches;

    PLATFORMS.forEach(function (p, i) {
      var d = document.createElementNS(NS, 'path');
      d.setAttribute('d', curve(c, centerOf(p.el, box), (i % 2 ? 1 : -1) * (desk ? 26 : 16)));
      s.appendChild(d);
      var L = d.getTotalLength();
      d.style.setProperty('--len', L);
      paths.push({ node: d, len: L, tier: 1, order: i });
    });

    if (!desk) return;   /* במובייל אין טבעת שנייה בבמה */

    DEVICES.forEach(function (dv, i) {
      var host = PLATFORMS.filter(function (p) { return p.id === dv.p; })[0];
      if (!host) return;
      var d = document.createElementNS(NS, 'path');
      d.setAttribute('d', curve(centerOf(host.el, box), centerOf(dv.el, box), (i % 2 ? 18 : -18)));
      d.setAttribute('stroke-width', '1.3');
      s.appendChild(d);
      var L = d.getTotalLength();
      d.style.setProperty('--len', L);
      paths.push({ node: d, len: L, tier: 2, order: i });
    });
  }

  /* ── כוריאוגרפיה ── */
  function seg(p, a, b) { return Math.max(0, Math.min(1, (p - a) / (b - a))); }

  function draw(p) {
    stage.style.setProperty('--p', p);
    var desk = mq.matches;

    paths.forEach(function (o) {
      var a = o.tier === 1 ? 0.10 + o.order * 0.055 : 0.45 + o.order * 0.055;
      o.node.style.strokeDashoffset = o.len * (1 - seg(p, a, a + 0.13));
    });

    PLATFORMS.forEach(function (pl, i) {
      var t = seg(p, 0.16 + i * 0.055, 0.16 + i * 0.055 + 0.12);
      pl.el.style.opacity = t;
      pl.el.style.transform = 'translate(-50%,-50%) scale(' + (0.72 + 0.28 * t) + ')';
    });

    DEVICES.forEach(function (dv, i) {
      var t = seg(p, (desk ? 0.51 : 0.55) + i * 0.05, (desk ? 0.51 : 0.55) + i * 0.05 + 0.12);
      dv.el.style.opacity = t;
      dv.el.style.transform = desk
        ? 'translate(-50%,-50%) translateY(' + (14 - 14 * t) + 'px)'
        : 'translateY(' + (12 - 12 * t) + 'px)';
    });
  }

  /* ── בקר הגלילה הנעוצה (בשני המצבים — ההבדל הוא אורך המסלול) ── */
  var ticking = false, travel = 0;
  function stickyTop() { return parseFloat(window.getComputedStyle(pin).top) || 0; }

  function measure() {
    /* במובייל מסלול קצר יותר: אצבע עוברת פחות מרחק ממגלגלת עכבר,
       ומסלול ארוך מרגיש כאילו העמוד נתקע.                          */
    travel = mq.matches
      ? Math.min(1500, window.innerHeight * 1.6)
      : Math.min(760,  window.innerHeight * 0.95);
    wrap.style.height = (pin.offsetHeight + travel + stickyTop()) + 'px';
    buildPaths();
    onScroll();
  }

  function onScroll() {
    var rect = wrap.getBoundingClientRect();
    draw(Math.max(0, Math.min(1, (stickyTop() - rect.top) / travel)));
  }

  function sync() { place(); measure(); }

  if (reduce) {
    place();
    buildPaths();
    draw(1);
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

/* ═══════════════════════════════════════════════════════════════════════════
   BACK TO TOP — כפתור צף לחזרה לראש העמוד
   מופיע אחרי גלילה של מסך אחד, טבעת סביבו מראה כמה מהעמוד נגלל,
   ולחיצה מחזירה לראש בגלילה חלקה (או מיידית אם המשתמש ביקש פחות תנועה).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  if (document.querySelector('.fs-top')) return;

  var btn = document.createElement('button');
  btn.className = 'fs-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'חזרה לראש העמוד');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
                  '<path d="M12 19.5V5"/><path d="M5.2 11.8L12 5l6.8 6.8"/></svg>';
  document.body.appendChild(btn);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tick = false, shown = false;

  /* documentElement ולא window: לעמוד יש overflow-x:clip על ה-root,
     ובמצב הזה scrollTop של ה-root הוא המקור האמין בכל הדפדפנים. */
  function y() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  function update() {
    var top = y();
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var want = top > Math.max(500, window.innerHeight * 0.8);
    if (want !== shown) { shown = want; btn.classList.toggle('on', shown); }
    if (shown) btn.style.setProperty('--sp', Math.min(1, top / max).toFixed(3));
  }

  /* טוויין ידני, וכל קפיצה עם behavior:'instant'.
     ל-html יש scroll-behavior:smooth, ולכן כל scrollTo רגיל הופך
     לאנימציה של הדפדפן שנקטעת ע"י בקרי הנעיצה בעמוד — התוצאה הייתה
     כפתור שלא מזיז כלום. 'instant' עוקף את זה, והריכוך נעשה כאן. */
  var anim = null;

  function jump(v) { window.scrollTo({ top: v, behavior: 'instant' }); }
  function stop() { if (anim) { cancelAnimationFrame(anim); anim = null; } }

  btn.addEventListener('click', function () {
    var from = y();
    if (reduce || from < 40) { stop(); jump(0); return; }
    stop();
    var t0 = 0;
    var dur = Math.min(900, 320 + from * 0.16);
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      /* easeInOutCubic — יציאה רכה, נחיתה רכה */
      var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      jump(Math.round(from * (1 - e)));
      if (k < 1) { anim = requestAnimationFrame(step); }
      else { anim = null; jump(0); }
    }
    anim = requestAnimationFrame(step);
    /* רשת ביטחון: אם ה-rAF נחנק (טאב ברקע, מכשיר עמוס) — לא משאירים
       את המשתמש תקוע באמצע העמוד. */
    setTimeout(function () { if (anim) { stop(); jump(0); } }, dur + 400);
  });

  /* נגיעה של המשתמש עוצרת את הטוויין — לא כולאים אותו באנימציה */
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, stop, { passive: true });
  });

  window.addEventListener('scroll', function () {
    if (tick) return;
    tick = true;
    requestAnimationFrame(function () { update(); tick = false; });
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('load', update);
  update();
})();
