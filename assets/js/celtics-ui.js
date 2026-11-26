/* Celtics portfolio interactions: reveals, active nav, counters, banner expand,
   card flip & filters, box-score tabs, shot-chart sync, parquet parallax, CV shamrock burst, back-to-top. */
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      reveals.forEach(function (el) { revObs.observe(el); });
    }
  }

  /* 2. Animated stat counters */
  var counters = document.querySelectorAll('[data-count]');
  function setFinalCounter(el) {
    var target = el.getAttribute('data-count');
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    el.textContent = prefix + target + suffix;
  }
  function animateCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var end = parseInt(el.getAttribute('data-count'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(end) || end === 0) { setFinalCounter(el); return; }
    var dur = Math.min(450, Math.max(240, end * 6));
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(eased * end) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else setFinalCounter(el);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      counters.forEach(setFinalCounter);
    } else {
      var cObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      counters.forEach(function (el) { setFinalCounter(el); cObs.observe(el); });
    }
  }

  /* 3. Active-section nav highlight */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  var trackedSections = navLinks.map(function (a) {
    var id = a.getAttribute('href').slice(1);
    return { link: a, el: document.getElementById(id) };
  }).filter(function (x) { return !!x.el; });

  function updateActiveNav() {
    var scrollPos = window.scrollY + 130;
    var active = null;
    trackedSections.forEach(function (item) {
      if (item.el.offsetTop <= scrollPos) active = item;
    });
    navLinks.forEach(function (a) { a.classList.remove('is-active'); });
    if (active) active.link.classList.add('is-active');
  }
  if (trackedSections.length) {
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  /* 4. Hanging Championship Banners: click to expand details */
  var bannerBtns = document.querySelectorAll('.champ-banner__btn');
  var bannerPanel = document.getElementById('banner-detail-panel');
  bannerBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      bannerBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (wasOpen && bannerPanel) {
        bannerPanel.hidden = true;
        return;
      }
      btn.setAttribute('aria-expanded', 'true');
      if (bannerPanel) {
        var title = btn.getAttribute('data-title') || '';
        var sub = btn.getAttribute('data-sub') || '';
        var meta = btn.getAttribute('data-meta') || '';
        var bullets = JSON.parse(btn.getAttribute('data-bullets') || '[]');
        bannerPanel.querySelector('.banner-detail__meta').textContent = meta;
        bannerPanel.querySelector('.banner-detail__title').textContent = title + ' — ' + sub;
        var ul = bannerPanel.querySelector('.banner-detail__list');
        ul.innerHTML = '';
        bullets.forEach(function (txt) {
          var li = document.createElement('li');
          li.textContent = txt;
          ul.appendChild(li);
        });
        bannerPanel.hidden = false;
      }
    });
  });

  /* 5. Trading-card flip + filter chips */
  var filterChips = document.querySelectorAll('.filter-chip[data-filter]');
  var cards = document.querySelectorAll('.trade-card[data-cat]');
  filterChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var cat = chip.getAttribute('data-filter');
      filterChips.forEach(function (c) {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      cards.forEach(function (card) {
        var show = cat === 'all' || card.getAttribute('data-cat') === cat;
        card.hidden = !show;
      });
    });
  });

  document.querySelectorAll('.flip-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var card = btn.closest('.trade-card');
      if (!card) return;
      var flipped = card.classList.toggle('is-flipped');
      card.querySelectorAll('.flip-toggle').forEach(function (b) {
        b.setAttribute('aria-pressed', flipped ? 'true' : 'false');
      });
    });
  });

  /* 6. Case studies Box Score tabs + row expansion */
  var boxTabs = document.querySelectorAll('.box-tab[data-tab]');
  var boxRows = document.querySelectorAll('.box-row[data-group]');
  boxTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-tab');
      boxTabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      boxRows.forEach(function (row) {
        var show = target === 'all' || row.getAttribute('data-group') === target;
        row.hidden = !show;
        var detail = row.nextElementSibling;
        if (detail && detail.classList.contains('box-detail')) {
          if (!show) detail.hidden = true;
        }
      });
    });
  });

  document.querySelectorAll('.box-expand-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var row = btn.closest('.box-row');
      if (!row) return;
      var detail = row.nextElementSibling;
      if (!detail || !detail.classList.contains('box-detail')) return;
      var open = !detail.hidden;
      detail.hidden = open;
      row.classList.toggle('is-open', !open);
      btn.setAttribute('aria-expanded', !open ? 'true' : 'false');
    });
  });

  /* 7. Shot Chart zone interaction synced with Stat Sheet */
  var shotZones = document.querySelectorAll('.shot-zone[data-zone]');
  var skillCards = document.querySelectorAll('.skill-stat-card[data-zone]');
  function activateZone(z) {
    shotZones.forEach(function (el) {
      var on = el.getAttribute('data-zone') === z;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    skillCards.forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-zone') === z);
    });
  }
  shotZones.forEach(function (el) {
    el.addEventListener('click', function () { activateZone(el.getAttribute('data-zone')); });
    el.addEventListener('mouseenter', function () { activateZone(el.getAttribute('data-zone')); });
  });
  skillCards.forEach(function (el) {
    el.addEventListener('mouseenter', function () { activateZone(el.getAttribute('data-zone')); });
  });

  /* 8. Parallax-lite parquet bands & Back-to-top basketball button */
  var btt = document.getElementById('back-to-top');
  var parquets = document.querySelectorAll('.parquet-band');
  function onScroll() {
    var y = window.scrollY || 0;
    if (btt) btt.classList.toggle('is-shown', y > 420);
    if (!reduced && parquets.length) {
      var shift = Math.round(y * 0.14);
      parquets.forEach(function (band) {
        band.style.backgroundPosition = '0px ' + shift + 'px';
      });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (btt) {
    btt.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* 9. Subtle Shamrock & Gold burst on CV download */
  function spawnBurst(x, y) {
    if (reduced) return;
    var layer = document.createElement('div');
    layer.className = 'burst-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    var colors = ['#007A33', '#BA9653', '#111412'];
    var glyphs = ['♣', '★', '◆'];
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('span');
      p.className = 'burst-piece';
      p.textContent = glyphs[i % glyphs.length];
      p.style.color = colors[i % colors.length];
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      var angle = (Math.PI * 2 * i) / 18 + (Math.random() * 0.25);
      var dist = 38 + Math.random() * 58;
      p.style.setProperty('--dx', Math.round(Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--dy', Math.round(Math.sin(angle) * dist - 14) + 'px');
      layer.appendChild(p);
    }
    setTimeout(function () { layer.remove(); }, 950);
  }
  document.querySelectorAll('[data-cv-burst]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var r = link.getBoundingClientRect();
      var x = e.clientX || (r.left + r.width / 2);
      var y = e.clientY || (r.top + r.height / 2);
      spawnBurst(x, y);
    });
  });
})();
