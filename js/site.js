
/* Proof page: tab switching */
(function () {
  var tabs = document.querySelectorAll('.tp-tab');
  if (!tabs.length) return;

  function show(name) {
    document.querySelectorAll('.tp-tab').forEach(function (t) {
      var on = t.getAttribute('data-panel') === name;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.tp-panel').forEach(function (p) {
      p.classList.toggle('on', p.id === 'panel-' + name);
    });
  }

  tabs.forEach(function (t) {
    t.setAttribute('role', 'tab');
    t.addEventListener('click', function () {
      var n = t.getAttribute('data-panel');
      show(n);
      if (history.replaceState) history.replaceState(null, '', '#' + n);
    });
  });

  var h = (location.hash || '').replace('#', '');
  if (h && document.getElementById('panel-' + h)) show(h);
})();

/* Perspective page: carousel (Option A only — Option B stacks them) */
(function () {
  var track = document.getElementById('povTrack');
  if (!track) return;
  var slides = track.querySelectorAll('.tp-pov-slide');
  var dots = document.querySelectorAll('.tp-pov-dot');
  var label = document.querySelector('.tp-pov-n');
  var i = 0;

  function go(n) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    track.style.transform = 'translateX(' + (-i * 100) + '%)';
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    if (label) label.textContent = (i + 1) + ' / ' + slides.length;
  }

  var btns = document.querySelectorAll('.tp-pov-btn');
  if (btns[0]) btns[0].addEventListener('click', function () { go(i - 1); });
  if (btns[1]) btns[1].addEventListener('click', function () { go(i + 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
  go(0);
})();

/* Contact form: no backend on a static preview — hand off to email */
(function () {
  var form = document.querySelector('.contact form, form.form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (sel) { var el = form.querySelector(sel); return el ? el.value : ''; };
    var body = encodeURIComponent(
      'Name: ' + v('input[placeholder*="Name" i], input:nth-of-type(1)') + '\n' +
      'Email: ' + v('input[type=email], input[placeholder*="Email" i]') + '\n' +
      'Company: ' + v('.company') + '\n\n' + v('textarea'));
    window.location.href = 'mailto:hello@wearethepossible.com'
      + '?subject=' + encodeURIComponent('Website enquiry') + '&body=' + body;
  });
})();

/* Mobile menu */
(function () {
  var btn = document.querySelector('.nav-toggle');
  var links = document.getElementById('navlinks');
  if (!btn || !links) return;

  var open = false;

  function set(next) {
    if (next === open) return;
    open = next;
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  }

  // pointerup rather than click: iOS delays click behind its 300ms
  // double-tap check, which made the burger flip before the panel moved
  btn.addEventListener('pointerup', function (e) {
    e.preventDefault();
    set(!open);
  });
  // keyboard and any browser without pointer events
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    if (e.detail === 0) set(!open);          // fired by Enter/Space
  });

  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { set(false); btn.focus(); }
  });

  document.addEventListener('pointerdown', function (e) {
    if (!open) return;
    if (!links.contains(e.target) && !btn.contains(e.target)) set(false);
  });

  // a width change can move us back to the desktop row; drop the state
  // so the panel never gets stranded open
  var w = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === w) return;     // iOS fires on URL-bar show/hide
    w = window.innerWidth;
    set(false);
  });
})();


/* ------------------------------------------------------------------
   Hero visual — "alignment, forming".

   Rules scatter, then converge to a shared left edge, hold, and scatter
   again. It is the company's own line motif, and the thing it describes
   (misalignment resolving into alignment) is what they actually sell.
   Brand colours only. Falls back to a static aligned frame under
   reduced-motion, and steps aside entirely if real footage is supplied.
------------------------------------------------------------------- */
(function () {
  var media = document.querySelector('.hero-media');
  var canvas = document.querySelector('.hero-canvas');
  if (!media || !canvas) return;

  // Real footage wins if it has been supplied.
  var video = media.querySelector('.hero-video');
  if (video && video.getAttribute('data-src')) {
    video.src = video.getAttribute('data-src');
    video.setAttribute('autoplay', '');
    video.play().then(function () {
      media.classList.add('has-video');
    }).catch(function () { /* keep the canvas */ });
  }

  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // weighted the way the brand uses these: coral and cream lead, teal
  // supports, lime is the rare accent
  var COLORS = ['#F0523D', '#F7F2EA', '#18BEB7', '#F0523D', '#F7F2EA',
                '#18BEB7', '#CCFF33', '#F0523D', '#F7F2EA'];
  var W = 0, H = 0, dpr = 1, bars = [], raf = null;

  function build() {
    var n = Math.max(11, Math.min(22, Math.round(H / 38)));
    bars = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0 : i / (n - 1);
      // aligned widths swell toward the middle so the resolved state
      // reads as a considered lockup rather than a flat block
      var swell = Math.pow(Math.sin(t * Math.PI), 1.15);
      bars.push({
        t: t,
        sx: Math.random() * W * 0.5,
        sw: W * (0.12 + Math.random() * 0.4),
        ax: W * 0.1,
        aw: W * (0.26 + 0.52 * swell),
        col: COLORS[i % COLORS.length],
        drift: 0.4 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function resize() {
    var r = media.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  // 0 = scattered, 1 = aligned
  function cycle(ms) {
    var period = 9000;
    var p = (ms % period) / period;
    var k;
    if (p < 0.34) k = p / 0.34;                    // converge
    else if (p < 0.62) k = 1;                      // hold aligned
    else if (p < 0.84) k = 1 - (p - 0.62) / 0.22;  // scatter
    else k = 0;                                    // hold scattered
    return k < 0 ? 0 : k > 1 ? 1 : k;
  }

  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  function paint(ms) {
    var k = ease(reduce ? 1 : cycle(ms));
    var barH = Math.max(4, Math.min(8, H / 90));
    // keep the field clear of the corner label
    var padTop = H * 0.06;
    var padBot = 74;
    var slot = (H - padTop - padBot) / (bars.length + 1);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#121C2B';
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var wob = reduce ? 0 : Math.sin(ms / 2600 * b.drift + b.phase) * (1 - k) * W * 0.035;
      var x = b.sx + (b.ax - b.sx) * k + wob;
      var w = b.sw + (b.aw - b.sw) * k;
      var y = padTop + slot * (i + 1) - barH / 2;

      // flat, full-strength colour — the brand uses solid rules, never tints
      ctx.fillStyle = b.col;
      ctx.fillRect(x, y, w, barH);
    }
  }

  // One persistent loop. Visibility is measured synchronously each frame
  // rather than tracked by an observer: in the single-file build the hero
  // starts inside a hidden route, and an async first callback reporting
  // "not intersecting" would otherwise latch the animation off for good.
  function tick(ms) {
    raf = requestAnimationFrame(tick);
    var r = media.getBoundingClientRect();
    if (!r.width || !r.height) return;              // hidden
    if (r.bottom < 0 || r.top > window.innerHeight) return;  // scrolled past
    if (Math.round(r.width) !== Math.round(W) ||
        Math.round(r.height) !== Math.round(H)) resize();
    if (!W || !H) return;
    paint(ms);
  }

  function start() {
    resize();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt); rt = setTimeout(start, 140);
  });

  window.addEventListener('routechange', function () { setTimeout(start, 0); });

  start();
})();

/* ------------------------------------------------------------------
   Inertial scroll.

   Eases the page toward a target instead of jumping with the wheel. Kept
   deliberately narrow, because hijacking scroll is easy to get wrong:

     - pointer:fine only — touch already has better native momentum
     - off entirely under prefers-reduced-motion
     - keyboard, scrollbar drag and Find-in-page stay native, and we
       resync to them rather than fight
     - nested scrollables (the card backs) keep their own scrolling
     - same-page anchors tween; hash ROUTES in the single-file build are
       left alone so the router still works

   CSS scroll-behavior is switched to auto only when this takes over, so
   the no-JS, touch and reduced-motion paths keep the native smoothing.
------------------------------------------------------------------- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  if (reduce || !fine) return;

  var root = document.documentElement;
  var prevBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  var EASE = 0.115;
  var NAV = 76;                 // sticky header height
  var target = window.scrollY;
  var current = target;
  var raf = null;
  var driving = false;

  function limit() {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  }

  function loop() {
    var delta = target - current;
    if (Math.abs(delta) < 0.5) {
      current = target;
      window.scrollTo(0, Math.round(current));
      raf = null;
      driving = false;
      return;
    }
    current += delta * EASE;
    window.scrollTo(0, Math.round(current));
    raf = requestAnimationFrame(loop);
  }

  function drive() {
    if (raf) return;
    driving = true;
    raf = requestAnimationFrame(loop);
  }

  function scrollable(el) {
    while (el && el !== document.body) {
      if (el.scrollHeight > el.clientHeight + 2) {
        var oy = getComputedStyle(el).overflowY;
        if (oy === 'auto' || oy === 'scroll') return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;                 // pinch-zoom
    if (scrollable(e.target)) return;      // let inner panes scroll themselves
    e.preventDefault();
    if (!driving) current = window.scrollY;
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16;        // lines
    else if (e.deltaMode === 2) d *= window.innerHeight;
    target = Math.max(0, Math.min(limit(), target + d));
    drive();
  }, { passive: false });

  // anything that scrolls natively wins; adopt its position
  window.addEventListener('scroll', function () {
    if (!driving) { target = current = window.scrollY; }
  }, { passive: true });

  window.addEventListener('resize', function () {
    target = current = window.scrollY;
  });

  function tweenTo(y) {
    if (!driving) current = window.scrollY;
    target = Math.max(0, Math.min(limit(), y));
    drive();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var i = href.indexOf('#');
    if (i === -1) return;

    var hash = href.slice(i + 1);
    if (!hash || hash.charAt(0) === '/') return;   // '#/about' is a route
    var base = href.slice(0, i);
    if (base && base !== location.pathname.split('/').pop()) return;

    var el = document.getElementById(hash);
    if (!el) return;
    e.preventDefault();
    tweenTo(el.getBoundingClientRect().top + window.scrollY - NAV);
    if (history.replaceState) history.replaceState(null, '', '#' + hash);
  }, true);

  // the router jumps between views; land at the top without a glide
  window.addEventListener('routechange', function () {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    driving = false;
    target = current = window.scrollY;
  });

  window.addEventListener('pagehide', function () {
    root.style.scrollBehavior = prevBehavior;
  });
})();

/* ------------------------------------------------------------------
   Logo wall — rows rise in sequence.

   The grid is 15 flat spans with no row markup, and the column count
   changes at mobile widths, so rows are worked out by measuring each
   logo's top offset rather than assumed. Within a row there is a small
   left-to-right offset so it sweeps instead of snapping as a block.
------------------------------------------------------------------- */
(function () {
  var section = document.querySelector('.clients');
  if (!section) return;
  var grid = section.querySelector('.client-static-grid');
  if (!grid) return;

  var brands = [].slice.call(grid.querySelectorAll('.brand'));
  if (!brands.length) return;

  var ROW_STAGGER = 130;   // ms between rows
  var COL_STAGGER = 38;    // ms between logos inside a row
  var LEAD = 110;          // ms after the section label
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lit = false;

  function measure() {
    // clear transforms so offsets are read from the settled layout
    var wasLit = section.classList.contains('logos-in');
    section.classList.remove('logos-ready', 'logos-in');

    // group by vertical CENTRE, not top: the grid centres its items, so a
    // taller logo (the Epic Talent circle) sits higher than its row-mates
    // and would otherwise be read as a row of its own
    var rows = [], last = null;
    brands.forEach(function (b) {
      var r = b.getBoundingClientRect();
      var mid = Math.round(r.top + r.height / 2);
      if (last === null || Math.abs(mid - last) > 12) { rows.push([]); last = mid; }
      rows[rows.length - 1].push(b);
    });

    // mobile drops to two columns, so the same 15 logos become eight rows.
    // Tighten the step as rows multiply, otherwise the tail runs past a
    // second and the last row feels stranded.
    var step = Math.max(55, Math.min(ROW_STAGGER, 620 / rows.length));

    rows.forEach(function (row, r) {
      row.forEach(function (b, c) {
        b.style.setProperty('--lg-d',
          Math.round(LEAD + r * step + c * COL_STAGGER) + 'ms');
      });
    });

    section.classList.add('logos-ready');
    if (wasLit) section.classList.add('logos-in');
    return rows.length;
  }

  if (reduce) { section.classList.add('logos-ready'); return; }

  function ready(fn) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn);
    else fn();
  }

  ready(function () {
    measure();

    function light() {
      if (lit) return;
      lit = true;
      section.classList.add('logos-in');
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { light(); io.disconnect(); } });
      }, { rootMargin: '0px 0px -18% 0px', threshold: 0 });
      io.observe(section);
    }

    function sweep() {
      if (lit) return;
      if (section.getBoundingClientRect().top < window.innerHeight * 0.85) light();
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sweep(); ticking = false; });
    }, { passive: true });
    window.addEventListener('load', sweep);
    window.addEventListener('routechange', function () { setTimeout(sweep, 0); });
    setTimeout(sweep, 300);

    // column count changes with width — re-measure, without replaying
    var rt, w = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (lit) {
          brands.forEach(function (b) { b.style.transition = 'none'; });
          measure();
          requestAnimationFrame(function () {
            brands.forEach(function (b) { b.style.transition = ''; });
          });
        } else {
          measure();
        }
      }, 180);
    });
  });
})();

/* ------------------------------------------------------------------
   Proof-strip pull quote — line-by-line mask reveal.

   The lime highlight runs across word and line boundaries, so there is no
   markup to split on. Every token (word AND whitespace) is wrapped, its
   line worked out from its measured top offset, then each line is rebuilt
   as a clipping block whose inner span rises into place.

   Whitespace is wrapped too, and inherits the highlight, so the lime band
   stays continuous instead of striping between words.
------------------------------------------------------------------- */
(function () {
  var section = document.querySelector('.proof-strip');
  if (!section) return;
  var quote = section.querySelector('.proof-strip-quote');
  if (!quote) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LINE_STAGGER = 90;   // ms between lines
  var LEAD = 90;           // ms before the first line moves
  var original = quote.innerHTML;
  var lit = false;
  var lineCount = 0;

  function tokenize(root) {
    var out = [];
    (function walk(node, hl) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var n = node.childNodes[i];
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          for (var p = 0; p < parts.length; p++) {
            if (parts[p] !== '') out.push({ t: parts[p], hl: hl });
          }
        } else if (n.nodeType === 1) {
          walk(n, hl || (n.classList && n.classList.contains('qhl')));
        }
      }
    })(root, false);
    return out;
  }

  function split() {
    quote.innerHTML = original;
    var tokens = tokenize(quote);

    // pass 1 — every token becomes an inline span we can measure
    quote.innerHTML = '';
    var spans = tokens.map(function (tok) {
      var s = document.createElement('span');
      s.textContent = tok.t;
      if (tok.hl) s.className = 'qhl';
      quote.appendChild(s);
      return s;
    });

    // pass 2 — group by vertical position
    var lines = [], last = null;
    spans.forEach(function (s) {
      var top = Math.round(s.getBoundingClientRect().top);
      if (last === null || Math.abs(top - last) > 4) {
        lines.push([]);
        last = top;
      }
      lines[lines.length - 1].push(s);
    });

    // pass 3 — rebuild as clipping blocks
    quote.innerHTML = '';
    lines.forEach(function (group, i) {
      var outer = document.createElement('span');
      outer.className = 'q-line';
      var inner = document.createElement('span');
      inner.style.setProperty('--ql-d', (LEAD + i * LINE_STAGGER) + 'ms');
      // drop a trailing space so the highlight cannot run past the line end
      while (group.length && /^\s+$/.test(group[group.length - 1].textContent)) {
        group.pop();
      }
      group.forEach(function (s) { inner.appendChild(s); });
      outer.appendChild(inner);
      quote.appendChild(outer);
    });
    lineCount = lines.length;

    // the surrounding elements pick up where the lines finish
    var tail = LEAD + lineCount * LINE_STAGGER;
    var kicker = section.querySelector('.kicker');
    if (kicker) kicker.style.setProperty('--ql-d', '0ms');
    var attr = section.querySelector('.proof-strip-attr');
    if (attr) attr.style.setProperty('--ql-d', tail + 'ms');
    var link = section.querySelector('.text-link');
    if (link) link.style.setProperty('--ql-d', (tail + 80) + 'ms');
  }

  if (reduce) {
    section.classList.add('q-lit');
    return;
  }

  function ready(fn) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fn);
    else fn();
  }

  ready(function () {
    split();

    function light() {
      if (lit) return;
      lit = true;
      section.classList.add('q-lit');
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { light(); io.disconnect(); }
        });
      }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });
      io.observe(section);
    }

    // same safety net as the generic reveals: never leave the quote hidden
    function sweep() {
      if (lit) return;
      if (section.getBoundingClientRect().top < window.innerHeight * 0.8) light();
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sweep(); ticking = false; });
    }, { passive: true });
    window.addEventListener('load', sweep);
    window.addEventListener('routechange', function () { setTimeout(sweep, 0); });
    setTimeout(sweep, 300);

    // line breaks change with width — re-measure, and skip the animation
    // if it has already played
    var rt, w = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      clearTimeout(rt);
      rt = setTimeout(function () {
        var wasLit = lit;
        section.classList.remove('q-lit');
        split();
        if (wasLit) {
          void quote.offsetWidth;          // flush, then restore instantly
          quote.querySelectorAll('.q-line>span').forEach(function (s) {
            s.style.transition = 'none';
          });
          section.classList.add('q-lit');
          requestAnimationFrame(function () {
            quote.querySelectorAll('.q-line>span').forEach(function (s) {
              s.style.transition = '';
            });
          });
        }
      }, 180);
    });
  });
})();

/* ------------------------------------------------------------------
   Scroll reveals.

   One shared system. Each section nominates the children that should
   animate, they get a 65ms stagger, and the section fires once at ~20%
   viewport entry. Chains are capped at 6 so nothing turns into a queue.
------------------------------------------------------------------- */
(function () {
  var GROUPS = [
    ['.clients',      ['.client-marquee-label']],
    // the logo grid and .proof-strip have their own modules below
    ['.pov',          ['.lines', '.kicker', '.lock-big', '.bridge', '.lock-lower', '.pov-copy']],
    ['.work-intro',   ['.lines', '.kicker', '.work-title', '.work-sub', '.work-copy']],
    ['.cards-sec',    ['.card']],
    ['.approach',     ['.lines', '.kicker', '.approach-title', '.approach-panel',
                       '.approach-visual-label', '.approach-circles']],
    ['.contact',      ['.lines', '.contact h2', '.contact p', '.form']],
    ['.tp-sec',       ['.tp-sec-title', '.problem-lock', '.tp-tabs', '.tp-panel.on',
                       '.tp-pov-slide', '.tp-why-grid', '.tp-cta-band']],
    ['.tp-page-hero', ['.lines', '.tp-kicker', '.tp-page-title', '.v14-page-sub']],
    ['.about-main',   ['.about-card', '.story']],
    ['.about-conversation', ['.kicker', '.about-conversation h2', '.about-conversation-right']]
  ];

  var STAGGER = 65;   // ms between siblings
  var CAP = 6;        // longest visible chain
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function collect(section, selectors) {
    var out = [];
    selectors.forEach(function (sel) {
      var found = section.querySelectorAll(sel);
      for (var i = 0; i < found.length; i++) {
        if (out.indexOf(found[i]) === -1) out.push(found[i]);
      }
    });
    return out;
  }

  var sections = [];
  GROUPS.forEach(function (g) {
    var found = document.querySelectorAll(g[0]);
    for (var i = 0; i < found.length; i++) {
      var sec = found[i];
      // the hero runs its own load choreography — leave it alone
      if (sec.closest && sec.closest('.hero-modern')) continue;
      var kids = collect(sec, g[1]);
      if (!kids.length) continue;
      kids.forEach(function (el, n) {
        el.setAttribute('data-rv', '');
        el.style.setProperty('--rv-d', Math.min(n, CAP) * STAGGER + 'ms');
        if (el.classList.contains('lines')) el.classList.add('rv-lines');
        // big display type travels a little further
        if (/lock-big|lock-lower|work-title|work-sub|tp-page-title|proof-strip-quote/
              .test(el.className)) {
          el.style.setProperty('--rv-y', '42px');
        }
      });
      sections.push({ el: sec, kids: kids });
    }
  });

  function revealAll(entry) {
    if (entry.done) return;
    entry.done = true;
    entry.kids.forEach(function (el) { el.classList.add('rv-in'); });
  }

  if (reduce || !('IntersectionObserver' in window)) {
    sections.forEach(revealAll);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el === en.target) { revealAll(sections[i]); break; }
      }
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });

  sections.forEach(function (s) { io.observe(s.el); });

  // Safety sweep. A fast scroll, an anchor jump, a restored scroll position
  // or a browser that batches observer callbacks can all skip a section
  // entirely — and a section that never intersects would stay at opacity 0
  // forever. Anything at or above the trigger line gets revealed regardless.
  function sweep() {
    var line = window.innerHeight * 0.8;
    sections.forEach(function (s) {
      if (s.done) return;
      if (s.el.getBoundingClientRect().top < line) {
        revealAll(s);
        io.unobserve(s.el);
      }
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { sweep(); ticking = false; });
  }, { passive: true });

  window.addEventListener('load', sweep);
  window.addEventListener('routechange', function () { setTimeout(sweep, 0); });
  setTimeout(sweep, 300);
})();

/* Mobile card fronts are hidden; carry the title onto the visible face */
(function () {
  document.querySelectorAll('.card').forEach(function (card) {
    var h3 = card.querySelector('.card-front h3');
    var back = card.querySelector('.card-back');
    if (h3 && back && !back.getAttribute('data-title')) {
      // the heading carries a <br>; keep it as a word break, not a join,
      // and read through the DOM so entities decode
      var clone = h3.cloneNode(true);
      Array.prototype.forEach.call(clone.querySelectorAll('br'), function (br) {
        br.parentNode.replaceChild(document.createTextNode(' '), br);
      });
      back.setAttribute('data-title', clone.textContent.replace(/\s+/g, ' ').trim());
    }
  });
})();
