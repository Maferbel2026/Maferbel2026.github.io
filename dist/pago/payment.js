const paymentTitle = document.querySelector('#payment-title');
const paymentMessage = document.querySelector('#payment-message');
const paymentBook = document.querySelector('#payment-book');
const paymentRetry = document.querySelector('#payment-retry');
const sessionId = new URLSearchParams(location.search).get('session_id');
const paymentApiOrigin = location.hostname === 'maferbel2026.github.io'
  ? 'https://femform-nutricion-online.ma-fer-13.chatgpt.site' : location.origin;

async function checkPayment() {
  paymentRetry.hidden = true;
  paymentBook.hidden = true;
  paymentTitle.innerHTML = 'Verificando <em>tu pago.</em>';
  paymentMessage.textContent = 'Estamos confirmando el pago antes de mostrarte tu enlace personal para elegir horario.';
  if (!sessionId || !/^cs_test_[A-Za-z0-9]{10,}$/.test(sessionId)) {
    paymentMessage.textContent = 'No encontramos una sesión de pago válida. Si ya pagaste, escríbenos para ayudarte.';
    return;
  }
  try {
    const response = await fetch(`${paymentApiOrigin}/api/booking?session_id=${encodeURIComponent(sessionId)}`, {
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !/^https:\/\/calendly\.com\//.test(result?.bookingUrl || '')) {
      throw new Error(result?.error || 'Todavía no pudimos confirmar tu pago.');
    }
    paymentTitle.innerHTML = 'Tu consulta <em>está lista.</em>';
    paymentMessage.textContent = 'Tu pago quedó confirmado. Ahora puedes elegir el horario de tu consulta.';
    paymentBook.href = result.bookingUrl;
    paymentBook.hidden = false;
  } catch (error) {
    paymentTitle.innerHTML = 'Aún estamos <em>confirmando.</em>';
    paymentMessage.textContent = error.message || 'No pudimos comprobar el pago por ahora. Inténtalo de nuevo.';
    paymentRetry.hidden = false;
  }
}

paymentRetry?.addEventListener('click', checkPayment);
checkPayment();
