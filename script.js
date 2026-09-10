// ===== Skyline Skylights — interactions =====

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  // Close the menu after tapping a link (mobile)
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Quote form (front-end only — wire up to your email/CRM backend later)
const form = document.getElementById('quoteForm');
const note = document.getElementById('formNote');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');

    if (!name.value.trim() || !email.value.trim()) {
      note.textContent = 'Please add your name and email so we can reach you.';
      note.style.color = '#c0392b';
      return;
    }

    note.style.color = '';
    note.textContent = `Thanks, ${name.value.trim().split(' ')[0]}! We'll be in touch within one business day.`;
    form.reset();
  });
}
