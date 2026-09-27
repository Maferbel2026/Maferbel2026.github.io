import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { hmacHex } from './crypto.js';
import { StripeGateway, verifiedPurchase } from './stripe.js';

const SITE = 'https://femform.example';
const ATTEMPT = '11111111-1111-4111-8111-111111111111';
const SESSION = 'cs_test_1234567890abcdef';
const ENV = {
  SITE_ORIGIN: SITE,
  STRIPE_SECRET_KEY: 'sk_test_fixture',
  STRIPE_WEBHOOK_SECRET: 'whsec_fixture',
  SHEETS_ENDPOINT: 'https://script.google.com/macros/s/test-fixture/exec',
  SHEETS_SIGNING_SECRET: 'fixture-only-secret',
};

function paidSession(overrides = {}) {
  return {
    id: SESSION, livemode: false, mode: 'payment', status: 'complete',
    payment_status: 'paid', currency: 'mxn', amount_total: 80000,
    client_reference_id: ATTEMPT, metadata: { service: 'primera' },
    customer_details: { email: 'paciente@example.com' }, ...overrides,
  };
}

test('Checkout saves the lead before Stripe and fixes amount on the server', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    if (url.includes('script.google.com')) {
      const envelope = JSON.parse(options.body);
      calls.push(JSON.parse(envelope.payload).action);
      return Response.json({ ok: true });
    }
    const params = new URLSearchParams(options.body);
    calls.push('stripe');
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), '80000');
    assert.equal(params.get('line_items[0][price_data][currency]'), 'mxn');
    assert.equal(params.get('customer_email'), 'paciente@example.com');
    assert.equal(params.get('client_reference_id'), ATTEMPT);
    assert.equal(params.get('mode'), 'payment');
    return Response.json({ id: SESSION, livemode: false,
      url: 'https://checkout.stripe.com/c/pay/test' });
  };
  const app = createApp({ fetcher, uuid: () => ATTEMPT });
  const response = await app(new Request(`${SITE}/api/checkout`, {
    method: 'POST', headers: { Origin: SITE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'Paciente@Example.com', service: 'primera', amount: 1 }),
  }), ENV);
  assert.equal(response.status, 200);
  assert.deepEqual(calls, ['lead_start', 'stripe', 'lead_session']);
});

test('Follow-up also uses its fixed MXN price and service code', async () => {
  const fetcher = async (url, options) => {
    if (url.includes('script.google.com')) {
      const message = JSON.parse(JSON.parse(options.body).payload);
      if (message.action === 'lead_start') assert.equal(message.data.serviceId, 'seguimiento');
      return Response.json({ ok: true });
    }
    const params = new URLSearchParams(options.body);
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), '60000');
    assert.equal(params.get('line_items[0][price_data][currency]'), 'mxn');
    assert.equal(params.get('metadata[service]'), 'seguimiento');
    return Response.json({ id: SESSION, livemode: false,
      url: 'https://checkout.stripe.com/c/pay/follow-up' });
  };
  const app = createApp({ fetcher, uuid: () => ATTEMPT });
  const response = await app(new Request(`${SITE}/api/checkout`, {
    method: 'POST', headers: { Origin: SITE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'paciente@example.com', service: 'seguimiento', amount: 80000 }),
  }), ENV);
  assert.equal(response.status, 200);
});

test('Stripe gateway accepts only Sandbox secret or restricted keys', () => {
  assert.doesNotThrow(() => new StripeGateway('rk_test_fixture'));
  assert.throws(() => new StripeGateway('rk_live_fixture'));
  assert.throws(() => new StripeGateway('sk_live_fixture'));
});

test('Booking rejects unpaid and altered-price sessions before asking Sheets', async () => {
  let sheetCalls = 0;
  const fetcher = async (url) => {
    if (url.includes('script.google.com')) { sheetCalls++; return Response.json({ ok: true }); }
    return Response.json(paidSession({ payment_status: 'unpaid' }));
  };
  const app = createApp({ fetcher });
  const response = await app(new Request(`${SITE}/api/booking?session_id=${SESSION}`), ENV);
  assert.equal(response.status, 403);
  assert.equal(sheetCalls, 0);
  assert.equal(verifiedPurchase(paidSession({ amount_total: 60000 })), null);
  assert.equal(verifiedPurchase(paidSession({ livemode: true })), null);
});

test('Webhook requires valid signature and a fresh verified paid session', async () => {
  const actions = [];
  const fetcher = async (url, options) => {
    if (url.includes('script.google.com')) {
      actions.push(JSON.parse(JSON.parse(options.body).payload).action);
      return Response.json({ ok: true, bookingUrl: 'https://calendly.com/d/test' });
    }
    return Response.json(paidSession());
  };
  const now = () => 1_800_000_000_000;
  const app = createApp({ fetcher, now });
  const body = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: SESSION } } });
  const invalid = await app(new Request(`${SITE}/api/stripe-webhook`, {
    method: 'POST', body, headers: { 'Stripe-Signature': 't=1800000000,v1=bad' },
  }), ENV);
  assert.equal(invalid.status, 400);
  assert.deepEqual(actions, []);

  const signature = await hmacHex(ENV.STRIPE_WEBHOOK_SECRET, `1800000000.${body}`);
  const valid = await app(new Request(`${SITE}/api/stripe-webhook`, {
    method: 'POST', body, headers: { 'Stripe-Signature': `t=1800000000,v1=${signature}` },
  }), ENV);
  assert.equal(valid.status, 200);
  assert.deepEqual(actions, ['payment_confirm']);
});
