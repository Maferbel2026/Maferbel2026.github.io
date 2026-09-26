const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const mobileMenu = window.matchMedia('(max-width: 1100px)');

function setMenu(open, returnFocus = false) {
  if (!menuButton || !mainNav) return;
  document.body.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  if (open) mainNav.querySelector('a')?.focus();
  else if (returnFocus) menuButton.focus();
}

menuButton?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (!document.body.classList.contains('menu-open')) return;
  if (event.key === 'Escape') { setMenu(false, true); return; }
  if (event.key !== 'Tab') return;
  const items = [menuButton, ...mainNav.querySelectorAll('a')];
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
mobileMenu.addEventListener('change', () => { if (!mobileMenu.matches) setMenu(false); });

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08, rootMargin: '0px 0px 35px 0px' });
  revealItems.forEach(item => observer.observe(item));
  document.documentElement.classList.add('js-ready');
}
