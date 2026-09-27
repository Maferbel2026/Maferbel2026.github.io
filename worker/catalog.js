export const SERVICES = Object.freeze({
  primera: Object.freeze({
    code: '#0000',
    name: 'Primera consulta nutricional',
    amount: 80000,
    duration: 60,
  }),
  seguimiento: Object.freeze({
    code: '#9999',
    name: 'Consulta nutricional de seguimiento',
    amount: 60000,
    duration: 45,
  }),
});

export function getService(id) {
  return Object.hasOwn(SERVICES, id) ? SERVICES[id] : null;
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
