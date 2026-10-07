/* Yamen Agha — portfolio interactions. Vanilla JS, no dependencies. */
(() => {
  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rtl = doc.dir === 'rtl';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- masthead state + mobile drawer ---------- */
  const mast = $('#mast');
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- reveal on scroll (staggered within a parent) ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const sibs = $$('.reveal', el.parentElement).filter((s) => !s.classList.contains('is-in'));
        el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- active section in nav + issue progress ---------- */
  const sections = $$('[data-section]');
  const progress = $('.progress');
  const progNum = $('#progress-num');
  const navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        const i = sections.indexOf(en.target);
        progNum.textContent = String(i + 1).padStart(2, '0');
        navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => so.observe(s));
  }

  /* ---------- scroll-driven parallax: layered name vs portrait ---------- */
  const back = $('.hero__name--back');
  const front = $('.hero__name--front');
  const figure = $('.hero__figure');
  const plate = $('.hero__plate');
  const ghosts = $$('[data-drift]');
  const phones = $$('[data-depth-y]');
  const metal = $$('.hero__name--back, .edu__year-num, .foot__sig');
  let mx = 0, my = 0, tx = 0, ty = 0, ticking = false;

  const frame = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    mast.classList.toggle('is-scrolled', y > 8);
    if (progress) progress.classList.toggle('is-on', y > vh * 0.8);
    if (reduce) return;
    tx += (mx - tx) * 0.08; ty += (my - ty) * 0.08;
    if (y < vh * 1.2) {
      back.style.translate = `${tx * -14}px ${y * 0.32 + ty * -8}px`;
      front.style.translate = `${tx * 22}px ${y * -0.12 + ty * 10}px`;
      figure.style.translate = `${tx * 6}px ${y * 0.06}px`;
      plate.style.translate = `${tx * 6}px ${y * 0.06}px`;
    }
    // light travelling across brushed-metal type as you scroll
    const sheen = (50 + Math.sin(y / 600) * 40 + tx * 10).toFixed(1);
    metal.forEach((m) => m.style.setProperty('--sheen', `${sheen}%`));
    ghosts.forEach((g) => {
      const r = g.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = (r.top - vh / 2) / vh;
      g.style.translate = `${(rtl ? 1 : -1) * p * 90}px 0`;
    });
    phones.forEach((ph) => {
      const r = ph.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      ph.style.translate = `0 ${(r.top - vh / 2) * parseFloat(ph.dataset.depthY)}px`;
    });
    if (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) request();
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  if (fine && !reduce) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      request();
    });
    hero.addEventListener('pointerleave', () => { mx = 0; my = 0; request(); });
  }
  frame();

  /* ---------- magnetic buttons + cursor-follow sheen ---------- */
  if (fine && !reduce) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('[data-sheen]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }
})();
