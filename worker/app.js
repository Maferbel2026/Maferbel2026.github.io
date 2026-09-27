import { getService, normalizeEmail } from './catalog.js';
import { verifyStripeSignature } from './crypto.js';
import { StripeGateway, verifiedPurchase } from './stripe.js';
import { SheetsGateway } from './sheets.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function json(value, status = 200, origin = null) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...JSON_HEADERS, ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}) },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = [env.SITE_ORIGIN, env.EXTRA_ORIGIN].filter(Boolean);
  return origin && allowed.includes(origin) ? origin : null;
}

function dependencies(env, fetcher, now) {
  if (!/^https:\/\/[^/]+$/.test(env.SITE_ORIGIN || '')) throw new Error('SITE_ORIGIN inválido.');
  return {
    stripe: new StripeGateway(env.STRIPE_SECRET_KEY, fetcher),
    sheets: new SheetsGateway(env.SHEETS_ENDPOINT, env.SHEETS_SIGNING_SECRET, fetcher, now),
  };
}

export function createApp({ fetcher = fetch, now = Date.now, uuid = () => crypto.randomUUID() } = {}) {
  return async function handle(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);

    if (request.method === 'OPTIONS' && url.pathname === '/api/checkout') {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      } });
    }

    if (url.pathname === '/api/checkout' && request.method === 'POST') {
      if (!origin || Number(request.headers.get('Content-Length') || 0) > 4096) {
        return json({ error: 'Solicitud no permitida.' }, 403, origin);
      }
      let input;
      try { input = await request.json(); } catch { return json({ error: 'Datos inválidos.' }, 400, origin); }
      const email = normalizeEmail(input?.email);
      const service = getService(input?.service);
      if (!email || !service || input?.website) return json({ error: 'Revisa tu correo y consulta.' }, 400, origin);

      const attemptId = uuid();
      try {
        const { stripe, sheets } = dependencies(env, fetcher, now);
        await sheets.call('lead_start', { attemptId, email, serviceId: input.service });
        let session;
        try {
          session = await stripe.createCheckout({ serviceId: input.service, email, attemptId, siteOrigin: env.SITE_ORIGIN });
        } catch (error) {
          await sheets.call('lead_error', { attemptId }).catch(() => {});
          throw error;
        }
        await sheets.call('lead_session', { attemptId, sessionId: session.id });
        return json({ url: session.url }, 200, origin);
      } catch (error) {
        console.error('Checkout no disponible:', error.message);
        return json({ error: 'No pudimos iniciar el pago. Inténtalo de nuevo en unos minutos.' }, 503, origin);
      }
    }

    if (url.pathname === '/api/booking' && request.method === 'GET') {
      try {
        const { stripe, sheets } = dependencies(env, fetcher, now);
        const session = await stripe.getSession(url.searchParams.get('session_id'));
        const purchase = verifiedPurchase(session);
        if (!purchase) return json({ error: 'El pago aún no está confirmado.' }, 403, origin);
        const result = await sheets.call('payment_confirm', purchase);
        if (!/^https:\/\/calendly\.com\//.test(result.bookingUrl || '')) {
          throw new Error('No se pudo emitir el enlace de agenda.');
        }
        return json({ bookingUrl: result.bookingUrl, service: purchase.serviceId }, 200, origin);
      } catch (error) {
        console.error('Agenda no disponible:', error.message);
        return json({ error: 'No pudimos confirmar la agenda todavía. Inténtalo de nuevo en unos minutos.' }, 503, origin);
      }
    }

    if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
      const body = await request.text();
      if (body.length > 65536 || !await verifyStripeSignature(
        request.headers.get('Stripe-Signature'), body, env.STRIPE_WEBHOOK_SECRET, now(),
      )) return json({ error: 'Firma inválida.' }, 400);
      let event;
      try { event = JSON.parse(body); } catch { return json({ error: 'Evento inválido.' }, 400); }
      if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
        return json({ received: true });
      }
      try {
        const { stripe, sheets } = dependencies(env, fetcher, now);
        const session = await stripe.getSession(event.data?.object?.id);
        const purchase = verifiedPurchase(session);
        if (!purchase) return json({ received: true });
        await sheets.call('payment_confirm', purchase);
        return json({ received: true });
      } catch (error) {
        console.error('No se procesó el pago confirmado:', error.message);
        return json({ error: 'Procesamiento pendiente.' }, 503);
      }
    }

    return json({ error: 'No encontrado.' }, 404, origin);
  };
}
