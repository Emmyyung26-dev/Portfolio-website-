/* ==========================================================================
   script.js  -  Interactions, animation and contact buttons
   (The 3D background lives in scene.js. Your details live in config.js.)
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasGsap && !reduceMotion;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Toast (small message at the bottom) ---------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 3800);
  }

  /* ---------- Loader ---------- */
  var loader = $('#loader');
  var heroStarted = false;
  function hideLoader() {
    if (loader) loader.classList.add('done');
    startHero();
  }
  window.addEventListener('load', function () { setTimeout(hideLoader, 450); });
  setTimeout(hideLoader, 3000); // safety net if something loads slowly

  /* ---------- Optional background video ---------- */
  var video = $('#bg-video');
  if (video) {
    var src = $('source', video);
    var dropVideo = function () { if (video.parentNode) video.parentNode.removeChild(video); };
    if (src) src.addEventListener('error', dropVideo);
    video.addEventListener('error', dropVideo);
    // "loadeddata" = the first frame is ready (even if autoplay is blocked, the frame/poster shows)
    video.addEventListener('loadeddata', function () {
      root.classList.add('has-video');
      if (reduceMotion) video.pause();
    });
    if (reduceMotion) { video.removeAttribute('autoplay'); }
    // Some phones block autoplay until a gesture: retry once on first touch
    var retry = function () { if (!reduceMotion && video.paused) video.play().catch(function () {}); };
    window.addEventListener('touchstart', retry, { once: true, passive: true });
  }

  /* ---------- Hero headline: split into words ---------- */
  var title = $('#hero-title');
  var words = [];
  if (title && animate) {
    var text = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', title.textContent.trim());
    title.innerHTML = text.map(function (w) {
      return '<span class="word" aria-hidden="true"><span>' + w + '</span></span>';
    }).join(' ');
    words = $$('.word > span', title);
  }

  if (animate) {
    root.classList.add('js-anim');
    gsap.registerPlugin(ScrollTrigger);
  }

  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    if (!animate) return;

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.set(title, { visibility: 'visible' })
      .from('.nav', { y: -40, opacity: 0, duration: 0.9 }, 0)
      .to('.hero .eyebrow', { opacity: 1, duration: 0.8 }, 0.1)
      .fromTo(words, { yPercent: 115, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.07 }, 0.2)
      .fromTo('.hero__text', { y: 24 }, { y: 0, opacity: 1, duration: 0.9 }, 0.85)
      .fromTo('.hero__cta', { y: 24 }, { y: 0, opacity: 1, duration: 0.9 }, 1.0)
      .to('.scroll-cue', { opacity: 1, duration: 1 }, 1.4);
  }

  /* ---------- Scroll reveals (cinematic fade-up) ---------- */
  if (animate) {
    gsap.set('[data-reveal]', { y: 44 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true });
      }
    });

    /* gentle parallax on section headings */
    $$('.section h2').forEach(function (h) {
      gsap.to(h, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* hero content drifts up and fades as you leave */
    gsap.to('.hero__inner', { yPercent: -12, opacity: 0.0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });
  }

  /* ---------- Nav: scrolled state, progress bar, active link ---------- */
  var nav = $('#nav');
  var bar = $('#progress');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    root.classList.toggle('is-scrolled', y > window.innerHeight * 0.5);
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  var links = $$('[data-link]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $('#nav-toggle');
  var menu = $('#nav-links');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- 3D tilt on cards ---------- */
  if (canHover && !reduceMotion) {
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt-max')) || 8;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Mouse-follow glow ---------- */
  var glow = $('#cursor-glow');
  if (glow && canHover && !reduceMotion) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
    (function follow() {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- Contact buttons (from config.js) ---------- */
  var waNumber = (CFG.whatsappNumber || '').replace(/\D/g, '');
  var waBtn = $('#btn-whatsapp');
  if (waNumber) {
    waBtn.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(CFG.whatsappMessage || '');
  } else {
    waBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toast('Add your WhatsApp number in config.js to activate this button.');
    });
    waBtn.removeAttribute('target');
  }

  var emailBtn = $('#btn-email');
  if (CFG.email) {
    emailBtn.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Website project enquiry');
  } else {
    emailBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toast('Add your email address in config.js to activate this button.');
    });
  }

  $$('[data-social]').forEach(function (a) {
    var url = CFG.socials && CFG.socials[a.getAttribute('data-social')];
    if (url) {
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    } else {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        toast('Add this profile link in config.js to activate it.');
      });
    }
  });

  /* Project buttons: "#" placeholders show a hint until you add a real link */
  $$('[data-project-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
        toast('Sample project. Add your live URL to this button (see README, step 4).');
      }
    });
  });

  /* ---------- About stats (only if you add real figures in config.js) ---------- */
  var statsEl = $('#stats');
  if (statsEl && CFG.stats && CFG.stats.length) {
    statsEl.hidden = false;
    statsEl.innerHTML = CFG.stats.map(function (s) {
      return '<div class="stat"><strong data-count="' + Number(s.value) + '" data-suffix="' + (s.suffix || '') + '">0' + (s.suffix || '') + '</strong><span>' + s.label + '</span></div>';
    }).join('');
    $$('[data-count]', statsEl).forEach(function (el) {
      var end = Number(el.getAttribute('data-count')), suffix = el.getAttribute('data-suffix');
      if (!animate) { el.textContent = end + suffix; return; }
      var o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v) + suffix; } });
      } });
    });
  }

  /* ---------- Contact form ---------- */
  var form = $('#contact-form');
  var status = $('#form-status');
  function setStatus(msg, type) { status.textContent = msg; status.className = 'form__status' + (type ? ' ' + type : ''); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.elements.company.value) return; // spam trap

    var ok = true;
    ['name', 'email', 'message'].forEach(function (n) {
      var f = form.elements[n];
      var good = f.value.trim() && (n !== 'email' || /^\S+@\S+\.\S+$/.test(f.value.trim()));
      f.parentNode.classList.toggle('invalid', !good);
      if (!good) ok = false;
    });
    if (!ok) { setStatus('Please complete your name, a valid email and your project details.', 'err'); return; }

    var data = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      service: form.elements.service.value,
      message: form.elements.message.value.trim()
    };

    if (CFG.formEndpoint) {
      setStatus('Sending...', '');
      fetch(CFG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('bad response');
        form.reset();
        setStatus('Thank you! Your message has been sent. I will reply soon.', 'ok');
      }).catch(function () {
        setStatus('Sorry, something went wrong. Please use the WhatsApp or email button instead.', 'err');
      });
    } else if (CFG.email) {
      var body = 'Name: ' + data.name + '\nEmail: ' + data.email + '\nService: ' + data.service + '\n\n' + data.message;
      window.location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Website project: ' + data.service) + '&body=' + encodeURIComponent(body);
      setStatus('Opening your email app...', 'ok');
    } else {
      setStatus('The form is not connected yet. Add your email or form endpoint in config.js.', 'err');
    }
  });

  $$('input, textarea', form).forEach(function (f) {
    f.addEventListener('input', function () { f.parentNode.classList.remove('invalid'); });
  });

  /* ---------- Footer year ---------- */
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* If GSAP failed to load, make sure nothing stays hidden */
  if (!animate) root.classList.remove('js-anim');
})();
