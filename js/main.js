(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var wrap = function (i, n) { return ((i % n) + n) % n; };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Шапка, меню, LED-лента, док
  var top = document.querySelector('.top');
  var dock = $('dock');
  var spine = document.querySelector('.spine');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = scrollY;
    var max = document.documentElement.scrollHeight - innerHeight;
    spine.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    top.classList.toggle('is-stuck', y > 40);
    dock.classList.toggle('is-on', y > innerHeight * .7 && y < max - 240);
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  var burger = document.querySelector('.burger');
  var menu = $('menu');
  function setMenu(open) {
    menu.hidden = !open;
    document.documentElement.classList.toggle('is-menu', open);
    document.body.style.overflow = open ? 'hidden' : '';
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // Запись
  var book = $('book');
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-book]');
    if (t && book.showModal) { e.preventDefault(); setMenu(false); book.showModal(); }
    if (e.target.closest('[data-close]')) book.close();
    if (e.target === book) {
      var r = book.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) book.close();
    }
  });

  $('year').textContent = new Date().getFullYear();

  // Цены
  var state = { branch: 'branch1', tier: 'barber' };
  var list = $('price-list');

  function arrow() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#arrow');
    svg.setAttribute('class', 'price__go');
    svg.setAttribute('aria-hidden', 'true');
    svg.append(use);
    return svg;
  }

  function money(n) { return String(n).replace(/\B(?=(\d{3})+$)/g, ' ') + ' ₽'; }

  function renderPrices() {
    var tiers = window.LORD_SERVICES[state.branch];
    var rows = tiers[state.tier] || tiers.barber;
    $('seg-tier').hidden = !tiers.topBarber;
    var frag = document.createDocumentFragment();
    rows.forEach(function (s, i) {
      var li = el('li');
      li.style.setProperty('--i', i);
      var a = el('a');
      a.href = s.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.append(el('span', 'price__name', s.name), el('span', 'price__sum', money(s.price)),
        el('span', 'price__min', s.min + ' мин'), arrow());
      li.append(a);
      frag.append(li);
    });
    list.replaceChildren(frag);
  }

  function segment(id, key, attr) {
    var box = $(id);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      state[key] = b.dataset[attr];
      box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      renderPrices();
    });
  }
  segment('seg-branch', 'branch', 'branch');
  segment('seg-tier', 'tier', 'tier');
  renderPrices();

  // Мастера
  var MASTERS = [
    ['crew-1', 'Кусаи', 'Топ-барбер', 'kusai', 1691274, 3642650],
    ['crew-1', 'Александр', 'Барбер', 'aleksandr', 1691274, 4159747],
    ['crew-1', 'Само', 'Барбер', 'samo', 1691274, 4445139],
    ['crew-1', 'Полина', 'Барбер', 'polina', 1691274, null],
    ['crew-2', 'Виктория', 'Барбер', 'viktoriya', 1890370, 4105633],
    ['crew-2', 'Мидо', 'Барбер', 'mido', 1890370, 4643271],
    ['crew-2', 'Алексей', 'Барбер', null, 1890370, 4502496]
  ];
  MASTERS.forEach(function (m) {
    var li = el('li', 'rv');
    var a = el('a');
    a.href = m[5] ? 'https://dikidi.net/ru/profile/' + m[4] + '/master/' + m[5] : 'https://dikidi.net/ru/profile/barbershop_lord_' + m[4];
    a.target = '_blank';
    a.rel = 'noopener';
    var frame = el('span', 'crew__frame');
    if (m[3]) {
      var img = el('img');
      img.src = 'assets/img/masters/' + m[3] + '.webp';
      img.width = img.height = 800;
      img.loading = 'lazy';
      img.alt = 'Мастер ' + m[1];
      frame.append(img);
    } else {
      var mono = el('span', 'crew__mono');
      mono.append(el('b', '', m[1].charAt(0)));
      frame.append(mono);
    }
    var role = el('span', 'crew__role');
    role.append(el('span', '', m[2]), el('em', '', 'Запись →'));
    a.append(frame, el('span', 'crew__name', m[1]), role);
    li.append(a);
    $(m[0]).append(li);
  });

  // Появление
  document.querySelectorAll('.manifest__img, .manifest__text, .sheet__head, .masters__head, .salon__head, .voices__list li, .place')
    .forEach(function (e) { e.classList.add('rv'); });
  var revealer = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealer.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll('.rv').forEach(function (e) { revealer.observe(e); });

  // I. Срез: следующая работа входит зубцами расчёски, а край идёт за пальцем
  (function () {
    var WORKS = shuffle(window.LORD_GALLERY.works);
    var N = WORKS.length;
    var src = function (i) { return 'assets/img/works/' + encodeURIComponent(WORKS[wrap(i, N)]); };

    var stage = $('cut'), base = $('cut-base'), next = $('cut-next'), edge = $('cut-edge');
    var numEl = $('cut-n'), comb = $('comb');
    var TEETH = 28, SPREAD = .5;
    var offs = [];
    for (var k = 0; k < TEETH; k++) offs.push((Math.sin(k * 1.7) + Math.sin(k * .63 + 1) + 2) / 4);

    var W = 0, H = 0, idx = 0, dir = 1, p = 0, busy = false, lastTouch = 0, visible = false, teased = false;

    function measure() {
      W = stage.clientWidth;
      H = stage.clientHeight;
      edge.parentNode.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }
    new ResizeObserver(measure).observe(stage);
    measure();

    function draw() {
      var tip = W * .06, h = H / TEETH, pts = [];
      for (var i = 0; i < TEETH; i++) {
        var t = clamp(p * (1 + SPREAD) - SPREAD * offs[i], 0, 1);
        var x = W + tip - t * (W + tip * 2);
        pts.push([x + tip, i * h], [x, (i + .5) * h], [x + tip, (i + 1) * h]);
      }
      if (dir < 0) pts = pts.map(function (q) { return [W - q[0], q[1]]; });
      var line = pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); });
      var outerX = dir > 0 ? W + tip * 3 : -tip * 3;
      next.style.clipPath = 'polygon(' + pts.map(function (q) { return q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px'; }).join(',') +
        ',' + outerX + 'px ' + H + 'px,' + outerX + 'px 0px)';
      edge.setAttribute('points', p > 0 && p < 1 ? line.join(' ') : '');
      next.style.transform = 'translateX(' + (dir * (1 - p) * 7).toFixed(2) + '%)';
      base.style.transform = 'scale(' + (1 + p * .05).toFixed(4) + ')';
    }

    function reset() {
      p = 0;
      next.style.clipPath = 'polygon(0 0,0 0,0 0)';
      next.style.transform = '';
      base.style.transform = '';
      edge.setAttribute('points', '');
    }

    function updateUi() {
      numEl.textContent = pad(idx + 1);
      stage.setAttribute('aria-label', 'Работа ' + (idx + 1) + ' из ' + N);
      comb.setAttribute('aria-valuenow', idx + 1);
      var teeth = comb.children;
      for (var i = 0; i < teeth.length; i++) {
        var d = Math.abs(i - idx);
        teeth[i].style.setProperty('--h', d > 5 ? 0 : (1 - d / 6).toFixed(2));
        teeth[i].classList.toggle('on', d === 0);
      }
    }

    function preload(i) { new Image().src = src(i); }

    function show(i) {
      idx = wrap(i, N);
      base.src = src(idx);
      base.alt = 'Стрижка: работа мастера LORD № ' + (idx + 1);
      preload(idx + 1);
      preload(idx - 1);
      updateUi();
    }

    function animate(to, ms, done) {
      var from = p, t0 = performance.now();
      busy = true;
      if (calm) ms = 1;
      (function step(now) {
        var t = clamp((now - t0) / ms, 0, 1);
        var e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        p = from + (to - from) * e;
        draw();
        if (t < 1) requestAnimationFrame(step);
        else { busy = false; if (done) done(); }
      })(t0);
    }

    function commit() {
      var i = idx + dir;
      base.src = src(i);
      var finish = function () { show(i); reset(); };
      if (base.decode) base.decode().then(finish, finish); else finish();
    }

    function go(d, ms) {
      if (busy) return;
      dir = d;
      next.src = src(idx + d);
      animate(1, ms || 1100, commit);
    }

    // Палец
    var start = null, dragging = false, lastX = 0, lastT = 0, speed = 0;
    stage.addEventListener('pointerdown', function (e) {
      if (busy || e.target.closest('button')) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      lastX = e.clientX; lastT = e.timeStamp; speed = 0;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!start || e.pointerId !== start.id) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        dragging = true;
        dir = dx < 0 ? 1 : -1;
        next.src = src(idx + dir);
        stage.setPointerCapture(e.pointerId);
        stage.classList.add('is-drag');
      }
      speed = (e.clientX - lastX) / Math.max(1, e.timeStamp - lastT);
      lastX = e.clientX; lastT = e.timeStamp;
      p = clamp(-dir * dx / (W * .8), 0, .999);
      draw();
    });
    function release() {
      if (!start) return;
      start = null;
      lastTouch = performance.now();
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-drag');
      if (p > .3 || -dir * speed > .5) animate(1, 420, commit);
      else animate(0, 320, reset);
    }
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    $('cut-prev').addEventListener('click', function () { lastTouch = performance.now(); go(-1, 800); });
    $('cut-next-btn').addEventListener('click', function () { lastTouch = performance.now(); go(1, 800); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(1, 800); lastTouch = performance.now(); }
      if (e.key === 'ArrowLeft') { go(-1, 800); lastTouch = performance.now(); }
    });

    // Расчёска под фото: каждый зубец — работа
    for (var c = 0; c < N; c++) comb.append(el('i'));
    comb.setAttribute('aria-valuemax', N);
    function combAt(e) {
      var r = comb.getBoundingClientRect();
      var i = clamp(Math.floor((e.clientX - r.left) / r.width * N), 0, N - 1);
      lastTouch = performance.now();
      if (i !== idx && !busy) { reset(); show(i); }
    }
    comb.addEventListener('pointerdown', function (e) { comb.setPointerCapture(e.pointerId); combAt(e); });
    comb.addEventListener('pointermove', function (e) { if (comb.hasPointerCapture(e.pointerId)) combAt(e); });
    comb.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (d) { e.preventDefault(); lastTouch = performance.now(); if (!busy) { reset(); show(idx + d); } }
    });

    $('cut-of').textContent = '/ ' + N;

    new IntersectionObserver(function (es) {
      var first = !base.getAttribute('src') && es[0].isIntersecting;
      visible = es[0].intersectionRatio > .5;
      if (first) show(0);
      // Подсказка жестом при первом показе
      if (visible && !teased && !calm) {
        teased = true;
        dir = 1;
        next.src = src(idx + 1);
        setTimeout(function () {
          if (busy || dragging) return;
          animate(.42, 800, function () { animate(0, 700, reset); });
        }, 500);
      }
    }, { rootMargin: '300px 0px 300px 0px', threshold: [0, .5] }).observe(stage);

    if (!calm) setInterval(function () {
      if (visible && !busy && !dragging && !document.hidden && performance.now() - lastTouch > 7000) go(1);
    }, 4200);
  })();

  // IV. Ротонда: зритель сидит в кресле в центре круга
  (function () {
    var PHOTOS = window.LORD_GALLERY.salon;
    var N = PHOTOS.length, STEP = 360 / N;
    var stage = $('rotunda'), ring = $('ring'), deg = $('dial-deg'), cap = $('ring-cap'), ticks = $('dial-ticks');
    var panes = [], R = 0, angle = 0, target = 0, vel = 0, drag = null;
    var running = false, visible = false, loaded = false, lastTouch = 0, lastActive = -1;

    PHOTOS.forEach(function (ph, i) {
      var pane = el('div', 'pane');
      var img = el('img');
      img.alt = ph[1];
      img.dataset.src = 'assets/img/salon/' + encodeURIComponent(ph[0]);
      pane.append(img);
      ring.append(pane);
      panes.push(pane);
    });

    for (var t = 0; t < 72; t++) {
      var a = t * 5 * Math.PI / 180, long = t % 2 === 0 ? 6 : 3;
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 60 + 58 * Math.sin(a));
      line.setAttribute('y1', 60 - 58 * Math.cos(a));
      line.setAttribute('x2', 60 + (58 - long) * Math.sin(a));
      line.setAttribute('y2', 60 - (58 - long) * Math.cos(a));
      line.setAttribute('stroke', 'currentColor');
      ticks.append(line);
    }

    function layout() {
      var W = stage.clientWidth, H = stage.clientHeight;
      var pw = Math.min(W * .72, H * .68, 440), ph = Math.min(H * .84, pw * 1.3);
      R = pw / (2 * Math.tan(Math.PI / N));
      stage.style.setProperty('--persp', (R * 1.14).toFixed(0) + 'px');
      stage.style.setProperty('--pw', pw.toFixed(1) + 'px');
      stage.style.setProperty('--ph', ph.toFixed(1) + 'px');
      panes.forEach(function (pane, i) {
        pane.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + (-R + .5).toFixed(1) + 'px)';
      });
      paint();
    }

    function paint() {
      ring.style.transform = 'translateZ(' + R.toFixed(1) + 'px) rotateY(' + angle.toFixed(2) + 'deg)';
      panes.forEach(function (pane, i) {
        var d = Math.abs(((angle + i * STEP + 180) % 360 + 360) % 360 - 180);
        pane.style.visibility = d > 72 ? 'hidden' : 'visible';
        pane.style.setProperty('--dim', Math.min(.72, d / 80).toFixed(2));
      });
      var shown = wrap(Math.round(angle), 360);
      deg.textContent = shown + '°';
      ticks.style.transform = 'rotate(' + angle.toFixed(1) + 'deg)';
      var active = wrap(Math.round(-angle / STEP), N);
      if (active !== lastActive) { lastActive = active; cap.textContent = PHOTOS[active][1]; }
    }

    function loop() {
      var diff = target - angle;
      if (!drag && (!visible || Math.abs(diff) < .02)) {
        angle = target;
        paint();
        running = false;
        return;
      }
      if (!drag) angle += diff * (calm ? 1 : .085);
      paint();
      requestAnimationFrame(loop);
    }
    function wake() { if (!running) { running = true; requestAnimationFrame(loop); } }

    function turn(d) {
      lastTouch = performance.now();
      target = (Math.round(target / STEP) + d) * STEP;
      wake();
    }

    var pxToDeg = function (px) { return px * 180 / Math.PI / R * 1.15; };

    stage.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, a: angle, id: e.pointerId, on: false, lx: e.clientX, lt: e.timeStamp };
      vel = 0;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
        drag.on = true;
        stage.setPointerCapture(e.pointerId);
      }
      vel = (e.clientX - drag.lx) / Math.max(1, e.timeStamp - drag.lt);
      drag.lx = e.clientX; drag.lt = e.timeStamp;
      angle = drag.a - pxToDeg(dx);
      wake();
    });
    function end() {
      if (!drag) return;
      var moved = drag.on;
      drag = null;
      lastTouch = performance.now();
      if (moved) target = Math.round((angle - pxToDeg(vel * 240)) / STEP) * STEP;
      wake();
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') turn(-1);
      if (e.key === 'ArrowLeft') turn(1);
    });
    $('ring-prev').addEventListener('click', function () { turn(1); });
    $('ring-next').addEventListener('click', function () { turn(-1); });

    new ResizeObserver(layout).observe(stage);
    layout();

    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !loaded) {
        loaded = true;
        panes.forEach(function (pane) { var im = pane.firstChild; im.src = im.dataset.src; });
      }
      visible = es[0].isIntersecting;
      if (visible) wake();
    }, { rootMargin: '500px 0px 500px 0px' }).observe(stage);

    if (!calm) setInterval(function () {
      if (visible && !drag && !document.hidden && performance.now() - lastTouch > 8000) { target -= STEP; wake(); }
    }, 3800);
  })();
})();
