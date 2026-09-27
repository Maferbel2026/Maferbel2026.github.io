const checkoutDialog = document.querySelector('#checkout-dialog');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutSummary = document.querySelector('#checkout-summary');
const checkoutStatus = document.querySelector('.checkout-dialog__status');
const checkoutEmail = document.querySelector('#checkout-email');
const checkoutSubmit = checkoutForm?.querySelector('button[type="submit"]');
const checkoutServices = {
  primera: 'Primera consulta nutricional · 60 minutos · $800 MXN',
  seguimiento: 'Consulta de seguimiento · 45 minutos · $600 MXN',
};
const checkoutApiOrigin = location.hostname === 'maferbel2026.github.io'
  ? 'https://femform-nutricion-online.ma-fer-13.chatgpt.site' : location.origin;
let selectedService = null;
let checkoutOpener = null;

function closeCheckout() {
  if (!checkoutDialog || checkoutDialog.hidden) return;
  checkoutDialog.hidden = true;
  document.body.style.overflow = '';
  checkoutOpener?.focus();
}

document.querySelectorAll('[data-checkout-service]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    if (!checkoutDialog) return;
    selectedService = link.dataset.checkoutService;
    checkoutOpener = link;
    checkoutSummary.textContent = checkoutServices[selectedService] || '';
    checkoutStatus.hidden = true;
    checkoutStatus.textContent = '';
    checkoutDialog.hidden = false;
    document.body.style.overflow = 'hidden';
    checkoutEmail.focus();
  });
});

checkoutDialog?.querySelector('[data-checkout-close]')?.addEventListener('click', closeCheckout);
checkoutDialog?.addEventListener('click', event => {
  if (event.target === checkoutDialog) closeCheckout();
});
document.addEventListener('keydown', event => {
  if (!checkoutDialog || checkoutDialog.hidden) return;
  if (event.key === 'Escape') { closeCheckout(); return; }
  if (event.key !== 'Tab') return;
  const items = [...checkoutDialog.querySelectorAll('button:not([disabled]), input:not(.checkout-honeypot), a[href]')];
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

checkoutForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedService || !checkoutForm.reportValidity()) return;
  checkoutSubmit.disabled = true;
  checkoutStatus.hidden = false;
  checkoutStatus.textContent = 'Preparando tu pago seguro…';
  try {
    const response = await fetch(`${checkoutApiOrigin}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: selectedService,
        email: checkoutEmail.value,
        website: checkoutForm.elements.website.value,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !/^https:\/\/checkout\.stripe\.com\//.test(result?.url || '')) {
      throw new Error(result?.error || 'No pudimos iniciar el pago.');
    }
    location.assign(result.url);
  } catch (error) {
    checkoutStatus.textContent = error.message || 'No pudimos iniciar el pago. Inténtalo más tarde.';
    checkoutSubmit.disabled = false;
  }
});
