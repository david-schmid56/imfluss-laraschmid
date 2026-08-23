(function () {
  'use strict';

  const STORAGE_KEY = 'ls-lang';
  const DEFAULT_LANG = 'de';

  // ===== LANGUAGE =====
  function setLang(lang) {
    document.documentElement.lang = lang;

    // Toggle active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langSwitch === lang);
    });

    // Elements with BOTH data-de and data-en: swap content.
    // Attributes may contain inline markup (<br>, <em>, <strong>) — this is
    // authored content, never user input, so innerHTML is safe here.
    document.querySelectorAll('[data-de][data-en]').forEach(el => {
      const val = el.getAttribute('data-' + lang);
      if (val !== null) el.innerHTML = val;
    });

    // Elements with ONLY data-de: show in DE, hide in EN
    document.querySelectorAll('[data-de]:not([data-en])').forEach(el => {
      el.style.display = lang === 'de' ? '' : 'none';
    });

    // Elements with ONLY data-en: hide in DE, show in EN
    document.querySelectorAll('[data-en]:not([data-de])').forEach(el => {
      el.style.display = lang === 'en' ? '' : 'none';
    });

    // Page title
    const titleEl = document.querySelector('title');
    if (titleEl && titleEl.getAttribute('data-' + lang)) {
      titleEl.textContent = titleEl.getAttribute('data-' + lang);
    }

    // Form hidden field
    const formLang = document.getElementById('form-lang');
    if (formLang) formLang.value = lang;

    // Select options
    document.querySelectorAll('select option').forEach(opt => {
      const val = opt.getAttribute('data-' + lang);
      if (val) opt.textContent = val;
    });

    localStorage.setItem(STORAGE_KEY, lang);
  }

  function initLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const browser = navigator.language?.startsWith('en') ? 'en' : DEFAULT_LANG;
    setLang(saved || browser);
  }

  document.querySelectorAll('[data-lang-switch]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.langSwitch));
  });

  // ===== MOBILE NAV =====
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = document.querySelector('.nav-wrapper')?.offsetHeight || 0;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 12, behavior: 'smooth' });
    });
  });

  // ===== FADE-IN ON SCROLL =====
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.pillar, .target-card, .offer-item, .t-card, .fact').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });

  // ===== FORM =====
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      const action = form.getAttribute('action');
      if (!action || action.includes('YOUR_FORM_ID')) {
        e.preventDefault();
        alert('Bitte richte Formspree ein (formspree.io) und ersetze YOUR_FORM_ID in index.html.');
        return;
      }
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const orig = btn.textContent;
      btn.disabled = true; btn.textContent = '…';
      try {
        const res = await fetch(action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) {
          const lang = document.body.classList.contains('lang-en') ? 'en' : 'de';
          form.innerHTML = `<div style="text-align:center;padding:4rem 1rem">
            <div style="font-size:2.5rem;margin-bottom:1rem;color:#6b8f6e">✦</div>
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;margin-bottom:0.75rem;color:#1c2e1e">
              ${lang === 'en' ? 'Message received!' : 'Nachricht erhalten!'}
            </h3>
            <p style="color:#5a6b5c;font-size:0.95rem">
              ${lang === 'en' ? 'I will get back to you within 48 hours.' : 'Ich melde mich innerhalb von 48 Stunden bei dir.'}
            </p>
          </div>`;
        } else { throw new Error(); }
      } catch {
        btn.disabled = false; btn.textContent = orig;
        alert('Etwas ist schiefgelaufen – bitte direkt per E-Mail schreiben.');
      }
    });
  }

  // ===== ACTIVE NAV =====
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPage) a.classList.add('nav-active');
  });

  initLang();
})();
