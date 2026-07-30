/* ══════════════════════════════════════════════════
   FELDMAN SYSTEMS — interactions
   Vanilla JS · no dependencies · prefers-reduced-motion honoured
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var deskHover = window.matchMedia('(hover: hover) and (min-width: 1000px)').matches;

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
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    rvs.forEach(function (el) { io.observe(el); });
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

  /* ── mega menu ── */
  var megaTrig = document.getElementById('megaTrig');
  var megaPanel = document.getElementById('megaPanel');
  if (megaTrig && megaPanel) {
    var megaOpen = false;
    var megaCloseTimer = null;

    function setMega(open) {
      megaOpen = open;
      megaTrig.setAttribute('aria-expanded', String(open));
      megaPanel.setAttribute('aria-hidden', String(!open));
      megaPanel.classList.toggle('open', open);
    }

    megaTrig.addEventListener('click', function (e) {
      e.preventDefault();
      setMega(!megaOpen);
    });

    if (deskHover) {
      var wrap = megaTrig.closest('.has-mega');
      wrap.addEventListener('mouseenter', function () {
        clearTimeout(megaCloseTimer);
        setMega(true);
      });
      wrap.addEventListener('mouseleave', function () {
        megaCloseTimer = setTimeout(function () { setMega(false); }, 160);
      });
    }

    megaPanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMega(false);
    });

    document.addEventListener('click', function (e) {
      if (megaOpen && !e.target.closest('.has-mega')) setMega(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && megaOpen) {
        setMega(false);
        megaTrig.focus();
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
      p.addEventListener('click', function () { openPanel(p); });
      if (deskHover) {
        p.addEventListener('mouseenter', function () { openPanel(p); });
      }
      p.addEventListener('focus', function () { openPanel(p); });
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

  /* ── process rail progressive fill ── */
  var rail = document.getElementById('rail');
  if (rail && !reduce && 'IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        rail.style.setProperty('--fill', 'calc(100% - 68px)');
        rio.unobserve(rail);
      });
    }, { threshold: 0.35 });
    rio.observe(rail);
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
})();
