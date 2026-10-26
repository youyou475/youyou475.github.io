(function () {
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- 深浅色 ---------- */
  var themeBtn = document.getElementById('theme');
  function setTheme(t) { root.classList.toggle('dark', t === 'dark'); store.set('pf-theme', t); }
  setTheme(store.get('pf-theme') || 'light');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    setTheme(root.classList.contains('dark') ? 'light' : 'dark');
  });

  /* ---------- 中英（默认跟随系统语言，手动选择后记忆） ---------- */
  var langBtns = document.querySelectorAll('[data-lang-btn]');
  function detectLang() {
    var ls = navigator.languages || [navigator.language || ''];
    return /^en/i.test(ls[0] || '') ? 'en' : 'zh';
  }
  function setLang(l) {
    root.classList.remove('zh', 'en');
    root.classList.add(l);
    root.lang = l === 'en' ? 'en' : 'zh-CN';
    store.set('pf-lang', l);
    langBtns.forEach(function (b) { b.classList.toggle('on', b.dataset.langBtn === l); });
  }
  setLang(store.get('pf-lang') || detectLang());
  langBtns.forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.langBtn); }); });

  /* ---------- 实时时钟（按时段换图标） ---------- */
  var timeEl = document.getElementById('time');
  if (timeEl) {
    function pad(n) { return ('0' + n).slice(-2); }
    function tick() {
      var d = new Date(), h = d.getHours();
      timeEl.dataset.t = (h >= 5 && h < 11) ? 'dawn' : (h >= 11 && h < 17) ? 'day' : (h >= 17 && h < 22) ? 'dusk' : 'night';
      var tv = timeEl.querySelector('.tval');
      if (tv) tv.textContent = pad(h) + ':' + pad(d.getMinutes());
    }
    tick(); setInterval(tick, 20000);
  }

  /* ---------- Hero 人像视差 + 姿态 ---------- */
  var stage = document.getElementById('stage');
  var port = document.getElementById('portrait');
  if (stage && port && !window.matchMedia('(hover: none)').matches) {
    stage.addEventListener('mousemove', function (ev) {
      var r = stage.getBoundingClientRect();
      var px = (ev.clientX - r.left) / r.width - 0.5;
      var py = (ev.clientY - r.top) / r.height - 0.5;
      port.style.setProperty('--px', (px * 28).toFixed(1) + 'px');
      port.style.setProperty('--py', (py * -16).toFixed(1) + 'px');
      port.style.setProperty('--pr', (px * 1.5).toFixed(2) + 'deg');
      var hov = ev.target.closest('[data-hover]');
      var pr = port.getBoundingClientRect();
      var overPort = ev.clientX > pr.left + pr.width * 0.22 && ev.clientX < pr.right - pr.width * 0.18 &&
        ev.clientY > pr.top + pr.height * 0.08 && ev.clientY < pr.bottom - pr.height * 0.06;
      stage.dataset.mode = hov ? hov.dataset.hover : (overPort ? 'portrait' : 'idle');
    });
    stage.addEventListener('mouseleave', function () {
      port.style.setProperty('--px', '0px');
      port.style.setProperty('--py', '0px');
      port.style.setProperty('--pr', '0deg');
      stage.dataset.mode = 'idle';
    });
  }

  /* ---------- 保险：任何情况下文字与内容都必须可见 ---------- */
  function ensureVisible() {
    // 逐字动画若因故未推进，强制显示标题
    document.querySelectorAll('.headline > .line').forEach(function (ln) {
      if (getComputedStyle(ln).opacity === '0') ln.style.opacity = '1';
    });
    // 视口内的浮现元素补漏（IntersectionObserver 未触发时兜底）
    // 用 IO 自己的 isIntersecting 判断不可靠，这里限量扫描：只在元素确实进入
    // 视口且 IO 明显未工作时才补，且整段逻辑 7 秒后随 visTimes 自然结束
    var pend = document.querySelectorAll('.rv:not(.in)');
    for (var i = 0; i < pend.length; i++) {
      var b = pend[i].getBoundingClientRect();
      if (b.top < window.innerHeight * 1.15 && b.bottom > -50) pend[i].classList.add('in');
    }
  }
  // 标题动画双保险：1.3s 后无论动画是否推进都显示终态
  setTimeout(function () {
    document.querySelectorAll('.headline').forEach(function (h) { h.classList.add('on'); });
  }, 1300);
  // 兜底只在加载后的有限窗口内低频跑，绝不挂 scroll 事件
  // （scroll 里做全文档查询 + getBoundingClientRect 会阻塞滚动合成）
  var visTimes = [400, 900, 1800, 2600, 3600, 5000, 7000];
  visTimes.forEach(function (t) { setTimeout(ensureVisible, t); });
  window.addEventListener('load', function () { setTimeout(ensureVisible, 400); });

  /* ---------- 命令面板 ---------- */
  var pal = document.getElementById('pal');
  var palList = document.getElementById('pal-list');
  var palQ = document.getElementById('pal-q');
  if (pal && palList) {
    var items = [];
    document.querySelectorAll('.menu a').forEach(function (a) {
      items.push({ t: a.textContent.trim(), h: a.getAttribute('href') });
    });
    document.querySelectorAll('main section[id]').forEach(function (s) {
      var h2 = s.querySelector('h2');
      var t = s.dataset.pal || (h2 ? h2.textContent.trim().slice(0, 24) : '');
      if (t && !items.some(function (i) { return i.h === '#' + s.id; })) {
        items.push({ t: t, h: '#' + s.id });
      }
    });
    var sel = 0;
    function render(q) {
      var list = items.filter(function (i) { return !q || i.t.toLowerCase().indexOf(q.toLowerCase()) > -1; });
      sel = 0;
      palList.innerHTML = list.map(function (i, n) {
        return '<button class="pal-item' + (n === 0 ? ' sel' : '') + '" data-h="' + i.h + '">' +
          '<span>' + i.t + '</span><em>' + i.h + '</em></button>';
      }).join('') || '<div style="padding:16px;font-size:13px;color:var(--ink3)">无结果</div>';
    }
    function open() { pal.hidden = false; document.body.classList.add('locked'); render(''); if (palQ) palQ.value = ''; setTimeout(function () { palQ && palQ.focus(); }, 30); }
    function close() { pal.hidden = true; document.body.classList.remove('locked'); }
    var cmdBtn = document.getElementById('cmd');
    if (cmdBtn) cmdBtn.addEventListener('click', open);
    document.addEventListener('keydown', function (ev) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); pal.hidden ? open() : close(); }
      if (!pal.hidden && ev.key === 'Escape') close();
      if (!pal.hidden && ev.key === 'ArrowDown') {
        var b = palList.querySelectorAll('.pal-item');
        if (b.length) { b[sel].classList.remove('sel'); sel = (sel + 1) % b.length; b[sel].classList.add('sel'); }
      }
      if (!pal.hidden && ev.key === 'Enter') {
        var cur = palList.querySelector('.pal-item.sel');
        if (cur) { var h = cur.dataset.h; close(); if (h.charAt(0) === '#') { var t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth' }); } else location.href = h; }
      }
    });
    if (palQ) palQ.addEventListener('input', function () { render(palQ.value); });
    pal.addEventListener('click', function (ev) {
      var b = ev.target.closest('.pal-item');
      if (b) {
        var h = b.dataset.h; close();
        if (h.charAt(0) === '#') { var t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
        else location.href = h;
      } else if (ev.target === pal) close();
    });
  }

  /* ---------- 滚动浮现 ---------- */
  var targets = Array.prototype.slice.call(document.querySelectorAll('.rv, .pf, .card, .tl-item, .wcard, .pcard2'));
  targets.forEach(function (el) { el.classList.add('rv'); });
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        ro.unobserve(en.target);
        var n = en.target.querySelector('[data-num]');
        if (n && !n.dataset.done) { n.dataset.done = 1; countUp(n); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el, i) {
      if (!el.style.transitionDelay) el.style.transitionDelay = Math.min(i % 8, 7) * 60 + 'ms';
      ro.observe(el);
    });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }
  function countUp(el) {
    var target = parseFloat(el.dataset.num);
    if (!isFinite(target)) return;
    var suffix = el.dataset.num.replace(/^[\d.]+/, '');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
    var dur = 1200, t0 = performance.now();
    function tick(now) {
      var p = Math.min((now - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 导航高亮 ---------- */
  var secs = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  if (secs.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        // 只响应导航真正对应的板块，作品子区等不抢高亮
        if (!navLinks.some(function (a) { return a.dataset.nav === id; })) return;
        navLinks.forEach(function (a) { a.classList.toggle('on', a.dataset.nav === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { spy.observe(s); });
  }
  navLinks.forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var h = a.getAttribute('href') || '';
      var i = h.indexOf('#');
      if (i > -1 && (h.slice(0, i) === '' || h.slice(0, i) === 'index.html')) {
        var id = h.slice(i + 1);
        var t = document.getElementById(id);
        if (t) { ev.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + id); }
      }
    });
  });

  /* ---------- 横向轨道 ---------- */
  document.querySelectorAll('.rail-nav').forEach(function (nav) {
    var wrap = nav.closest('.rail-wrap') || nav.closest('.rail-sec');
    var rail = wrap && wrap.querySelector('.rail');
    if (!rail) return;
    nav.querySelectorAll('.rnav').forEach(function (b) {
      b.addEventListener('click', function () {
        rail.scrollBy({ left: (b.dataset.dir === 'next' ? 1 : -1) * Math.max(280, rail.clientWidth * 0.82), behavior: 'smooth' });
      });
    });
  });

  /* ---------- 作品分类 tabs（上栏） ---------- */
  var wtabs = document.querySelector('.wtabs');
  if (wtabs) {
    var mainTabs = Array.prototype.slice.call(wtabs.querySelectorAll('.wtab'));
    var subGroups = Array.prototype.slice.call(wtabs.querySelectorAll('.wtab-sub'));
    var subChips = Array.prototype.slice.call(wtabs.querySelectorAll('.wtab-sub a'));
    function setCat(cat) {
      mainTabs.forEach(function (t) { t.classList.toggle('on', t.dataset.cat === cat); });
      subGroups.forEach(function (g) { g.classList.toggle('on', g.dataset.for === cat); });
    }
    mainTabs.forEach(function (t) {
      t.addEventListener('click', function () { setCat(t.dataset.cat); });
    });
    subChips.forEach(function (a) {
      a.addEventListener('click', function () {
        subChips.forEach(function (x) { x.classList.toggle('on', x === a); });
      });
    });
    var wsecs = Array.prototype.slice.call(document.querySelectorAll('.rail-sec, .rail-wrap'));
    if ('IntersectionObserver' in window && wsecs.length) {
      var wio = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          var host = el.classList.contains('rail-sec') ? el : (el.closest('.rail-sec') || el);
          setCat(host.id || '');
          var cur = el.id ? wtabs.querySelector('.wtab-sub.on a[href="#' + el.id + '"]') : null;
          subChips.forEach(function (x) { x.classList.toggle('on', x === cur); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      wsecs.forEach(function (s) { wio.observe(s); });
    }
    setCat((wsecs[0] && wsecs[0].closest('.rail-sec') || {}).id || '');
  }

  /* ---------- 多片段切换 ---------- */
  document.addEventListener('click', function (ev) {
    var sel = ev.target.closest('.vsel');
    if (!sel) return;
    var card = sel.closest('.wcard');
    var list = JSON.parse(card.dataset.vids);
    var item = list[+sel.dataset.i];
    var shot = card.querySelector('.shot');
    var v = card.querySelector('video.hv');
    if (!v) {
      v = document.createElement('video');
      v.className = 'hv'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      if (shot) shot.appendChild(v);
    }
    if (v) { v.src = item.src; }
    if (shot) shot.dataset.vsrc = item.src;
    var img = card.querySelector('.shot > img');
    if (img && item.poster) img.src = item.poster;
    var go = card.querySelector('.go[data-src]');
    if (go) go.dataset.src = item.src;
    card.querySelectorAll('.vsel').forEach(function (b) { b.classList.toggle('on', b === sel); });
    if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  });

  /* ---------- 灯箱 ---------- */
  var lb = document.getElementById('lb');
  if (lb) {
    var body = lb.querySelector('.lb-body');
    var cap = lb.querySelector('.lb-cap');
    var prev = lb.querySelector('.prev'), next = lb.querySelector('.next');
    var gallery = [], gi = 0, scrollMode = false;
    function openLb() { lb.hidden = false; document.body.classList.add('locked'); }
    function closeLb() {
      lb.hidden = true; document.body.classList.remove('locked');
      var v = lb.querySelector('video'); if (v) v.pause();
      body.innerHTML = ''; body.className = 'lb-body';
    }
    function showImage(i) {
      var g = gallery[i];
      body.className = 'lb-body' + (scrollMode ? ' scroll' : '');
      var img = document.createElement('img');
      img.src = g.src; img.alt = '';
      body.innerHTML = ''; body.appendChild(img);
      cap.textContent = (g.cap || '') + (gallery.length > 1 && !scrollMode ? '  ·  ' + (i + 1) + ' / ' + gallery.length : '');
      prev.hidden = next.hidden = gallery.length < 2 || scrollMode;
      gi = i;
    }
    function showVideo(src, title) {
      body.className = 'lb-body';
      var v = document.createElement('video');
      v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
      body.innerHTML = ''; body.appendChild(v);
      cap.textContent = title || '';
      prev.hidden = next.hidden = true;
    }
    document.addEventListener('click', function (ev) {
      var ph = ev.target.closest('.ph-item');
      if (ph) {
        var host = ph.closest('[data-album]') || ph;
        var start = 0;
        if (host.dataset && host.dataset.gal) {
          try { gallery = JSON.parse(host.dataset.gal); } catch (err) { gallery = []; }
          for (var i = 0; i < gallery.length; i++) {
            if (gallery[i].src === ph.dataset.src) { start = i; break; }
          }
        }
        if (!gallery.length) {
          var nodes = Array.prototype.slice.call(host.querySelectorAll('.ph-item'));
          gallery = nodes.map(function (b) { return { src: b.dataset.src, cap: b.dataset.cap }; });
          start = nodes.indexOf(ph);
        }
        scrollMode = false; openLb(); showImage(start < 0 ? 0 : start);
        return;
      }
      var lg = ev.target.closest('.long');
      if (lg) { gallery = [{ src: lg.dataset.src, cap: lg.dataset.cap }]; scrollMode = true; openLb(); showImage(0); return; }
      var go = ev.target.closest('.go[data-src]');
      if (go) { openLb(); showVideo(go.dataset.src, go.dataset.title); return; }
      if (ev.target.closest('.lb-x') || ev.target === lb) closeLb();
    });
    prev.addEventListener('click', function () { showImage((gi - 1 + gallery.length) % gallery.length); });
    next.addEventListener('click', function () { showImage((gi + 1) % gallery.length); });
    document.addEventListener('keydown', function (ev) {
      if (lb.hidden) return;
      if (ev.key === 'Escape') closeLb();
      if (gallery.length > 1 && !scrollMode) {
        if (ev.key === 'ArrowLeft') showImage((gi - 1 + gallery.length) % gallery.length);
        if (ev.key === 'ArrowRight') showImage((gi + 1) % gallery.length);
      }
    });
    // hover 才动态创建 video（初始零视频元素，避免视频图层拖垮渲染）
    function ensureVideo(card) {
      var shot = card.querySelector('.shot');
      var v = card.querySelector('video.hv');
      if (!v && shot && shot.dataset.vsrc) {
        v = document.createElement('video');
        v.className = 'hv'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
        v.src = shot.dataset.vsrc;
        shot.appendChild(v);
      }
      return v;
    }
    document.addEventListener('pointerover', function (ev) {
      var card = ev.target.closest('.wcard'); if (!card) return;
      var v = ensureVideo(card); if (!v) return;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    document.addEventListener('pointerout', function (ev) {
      var card = ev.target.closest('.wcard'); if (!card) return;
      var v = card.querySelector('video.hv'); if (!v) return;
      v.pause(); v.remove();   // 离开即移除，清掉视频图层
    });
  }

  /* ---------- 三面切换 ---------- */
  var faces = document.querySelectorAll('.face');
  if (faces.length) {
    var dots = document.querySelectorAll('.fsw .dots i');
    var idx = 0;
    function showFace(i) {
      idx = (i + faces.length) % faces.length;
      faces.forEach(function (f, n) { f.hidden = n !== idx; });
      dots.forEach(function (d, n) { d.classList.toggle('on', n === idx); });
    }
    document.querySelectorAll('[data-face-btn]').forEach(function (b) {
      b.addEventListener('click', function () { showFace(idx + (b.dataset.faceBtn === 'next' ? 1 : -1)); });
    });
    showFace(0);
  }
  window.__pfReady = 1;
})();
