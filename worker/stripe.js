import { getService, normalizeEmail } from './catalog.js';

const API = 'https://api.stripe.com/v1';

export class StripeGateway {
  constructor(secret, fetcher = fetch) {
    if (!/^(sk|rk)_test_/.test(secret || '')) throw new Error('Stripe Sandbox no está configurado.');
    this.secret = secret;
    this.fetcher = fetcher;
  }

  async request(path, options = {}) {
    const response = await this.fetcher(API + path, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secret}`,
        ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
    });
    const value = await response.json().catch(() => null);
    if (!response.ok || !value) throw new Error(`Stripe respondió ${response.status}.`);
    return value;
  }

  async createCheckout({ serviceId, email, attemptId, siteOrigin }) {
    const service = getService(serviceId);
    if (!service || !normalizeEmail(email)) throw new Error('Datos de consulta inválidos.');
    const params = new URLSearchParams({
      ui_mode: 'hosted_page',
      mode: 'payment',
      billing_address_collection: 'auto',
      'phone_number_collection[enabled]': 'false',
      'automatic_tax[enabled]': 'false',
      allow_promotion_codes: 'false',
      submit_type: 'auto',
      integration_identifier: 'hosted_web_0001',
      origin_context: 'web',
      'name_collection[individual][enabled]': 'true',
      'name_collection[individual][optional]': 'true',
      customer_email: email,
      client_reference_id: attemptId,
      'metadata[service]': serviceId,
      'line_items[0][price_data][currency]': 'mxn',
      'line_items[0][price_data][unit_amount]': String(service.amount),
      'line_items[0][price_data][product_data][name]': service.name,
      'line_items[0][quantity]': '1',
      success_url: `${siteOrigin}/pago/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/#consultas`,
    });
    const session = await this.request('/checkout/sessions', { method: 'POST', body: params });
    if (session.livemode !== false || !session.id?.startsWith('cs_test_') ||
        !session.url?.startsWith('https://checkout.stripe.com/')) {
      throw new Error('Stripe no devolvió una sesión de prueba válida.');
    }
    return session;
  }

  async getSession(id) {
    if (typeof id !== 'string' || !/^cs_test_[A-Za-z0-9]{10,}$/.test(id)) {
      throw new Error('Identificador de sesión inválido.');
    }
    return this.request(`/checkout/sessions/${encodeURIComponent(id)}`);
  }
}

export function verifiedPurchase(session) {
  const serviceId = session?.metadata?.service;
  const service = getService(serviceId);
  const email = normalizeEmail(session?.customer_details?.email || session?.customer_email);
  if (!service || !email || session?.livemode !== false || session?.mode !== 'payment' ||
      session?.status !== 'complete' || session?.payment_status !== 'paid' ||
      session?.currency !== 'mxn' || session?.amount_total !== service.amount ||
      !/^cs_test_[A-Za-z0-9]{10,}$/.test(session?.id || '') ||
      !/^[0-9a-f-]{36}$/.test(session?.client_reference_id || '')) return null;
  return {
    attemptId: session.client_reference_id,
    sessionId: session.id,
    serviceId,
    email,
    amount: service.amount / 100,
  };
}
