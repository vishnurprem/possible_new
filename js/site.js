
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
  btn.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* Scroll reveal — one pass, respects reduced motion */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  var targets = document.querySelectorAll(
    '.clients, .proof-strip, .pov, .work-intro, .cards-sec, .approach, .contact, .tp-sec');
  targets.forEach(function (t) { t.classList.add('reveal'); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
  targets.forEach(function (t) { io.observe(t); });
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
