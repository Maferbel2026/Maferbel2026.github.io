import { hmacHex } from './crypto.js';

export class SheetsGateway {
  constructor(endpoint, secret, fetcher = fetch, now = Date.now) {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint || '') || !secret) {
      throw new Error('Registro de consultas no configurado.');
    }
    this.endpoint = endpoint;
    this.secret = secret;
    this.fetcher = fetcher;
    this.now = now;
  }

  async call(action, data) {
    const payload = JSON.stringify({ action, data, at: this.now() });
    const signature = await hmacHex(this.secret, payload);
    const response = await this.fetcher(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ payload, signature }),
      redirect: 'follow',
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) throw new Error('No se pudo registrar la consulta.');
    return result;
  }
}
