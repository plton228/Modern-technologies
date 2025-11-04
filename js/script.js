(function () {
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Mobile menu toggle
  const menuToggle = qs('.menu-toggle');
  const menu = qs('.menu');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
    // Close menu on link click (mobile)
    qsa('.menu__link').forEach((link) => link.addEventListener('click', () => menu.classList.remove('open')));
  }

  // Simple slider on gallery page
  const track = qs('.slider__track');
  const items = qsa('.slider__item');
  const prevBtn = qs('.slider__btn--prev');
  const nextBtn = qs('.slider__btn--next');
  let index = 0;

  function goTo(i) {
    if (!track || items.length === 0) return;
    index = (i + items.length) % items.length;
    const offset = -index * 100;
    track.style.transform = `translateX(${offset}%)`;
  }

  if (prevBtn && nextBtn && track) {
    prevBtn.addEventListener('click', () => goTo(index - 1));
    nextBtn.addEventListener('click', () => goTo(index + 1));

    // Auto-play every 4s
    setInterval(() => goTo(index + 1), 4000);
  }

  // Contact form: save to localStorage
  const form = qs('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = qs('#name')?.value?.trim();
      const email = qs('#email')?.value?.trim();
      const message = qs('#message')?.value?.trim();
      const submittedAt = new Date().toISOString();

      const existing = JSON.parse(localStorage.getItem('contacts') || '[]');
      existing.push({ name, email, message, submittedAt });
      localStorage.setItem('contacts', JSON.stringify(existing));

      const ok = qs('#contact-success');
      if (ok) ok.style.display = 'block';
      form.reset();
    });
  }
})();


