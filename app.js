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

  /* ── showreel: YouTube facade — iframe only loads on click ── */
  var facade = document.getElementById('reelFacade');
  if (facade) {
    /* play-shaped cursor that tracks the pointer inside the video frame,
       so it reads as a video and not a static image */
    var frame  = facade.closest('.reel-frame');
    var cursor = document.getElementById('reelCursor');
    if (frame && cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var cTick = false, cx = 0, cy = 0;
      frame.addEventListener('pointerenter', function () { frame.classList.add('cur-on'); });
      frame.addEventListener('pointerleave', function () { frame.classList.remove('cur-on'); });
      frame.addEventListener('pointermove', function (e) {
        var r = frame.getBoundingClientRect();
        cx = e.clientX - r.left;
        cy = e.clientY - r.top;
        if (cTick) return;
        cTick = true;
        requestAnimationFrame(function () {
          cursor.style.setProperty('--cx', cx + 'px');
          cursor.style.setProperty('--cy', cy + 'px');
          cTick = false;
        });
      });
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
