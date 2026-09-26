const waitlistDialog = document.querySelector('#waitlist-dialog');
const waitlistForm = document.querySelector('#waitlist-form');
const waitlistStatus = waitlistForm?.querySelector('.waitlist-form__status');
let waitlistOpener = null;

function showWaitlistStatus(message) {
  if (!waitlistStatus) return;
  waitlistStatus.textContent = message;
  waitlistStatus.hidden = false;
}

function closeWaitlist() {
  if (!waitlistDialog || waitlistDialog.hidden) return;
  waitlistDialog.hidden = true;
  document.body.style.overflow = '';
  waitlistOpener?.focus();
}

document.querySelectorAll('[data-waitlist-open]').forEach(button => {
  button.addEventListener('click', () => {
    if (!waitlistDialog) return;
    waitlistOpener = button;
    if (waitlistStatus) { waitlistStatus.hidden = true; waitlistStatus.textContent = ''; }
    waitlistDialog.hidden = false;
    document.body.style.overflow = 'hidden';
    waitlistForm?.querySelector('input')?.focus();
  });
});

waitlistDialog?.querySelector('[data-waitlist-close]')?.addEventListener('click', closeWaitlist);
waitlistDialog?.addEventListener('click', event => {
  if (event.target === waitlistDialog) closeWaitlist();
});
document.addEventListener('keydown', event => {
  if (!waitlistDialog || waitlistDialog.hidden) return;
  if (event.key === 'Escape') { closeWaitlist(); return; }
  if (event.key !== 'Tab') return;
  const focusable = [...waitlistDialog.querySelectorAll('button, input, a[href]')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

if (waitlistForm) {
  const addField = (name) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    waitlistForm.append(input);
    return input;
  };
  const tokenField = addField('token');
  const originField = addField('siteOrigin');
  addField('website');

  waitlistForm.addEventListener('submit', event => {
    const endpoint = waitlistForm.dataset.endpoint?.trim();
    if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) {
      event.preventDefault();
      showWaitlistStatus('La lista de espera no está disponible en este momento. Intenta más tarde.');
      return;
    }
    tokenField.value = crypto.randomUUID().replaceAll('-', '');
    originField.value = location.origin;
    waitlistForm.action = endpoint;
    waitlistForm.method = 'POST';
    showWaitlistStatus('Guardando tu lugar en la lista de espera…');
  });
}
