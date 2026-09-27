import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'worker');
const output = resolve(root, 'dist/server');
const assets = resolve(root, 'dist/client');
rmSync(output, { recursive: true, force: true });
rmSync(assets, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
mkdirSync(assets, { recursive: true });
for (const file of ['catalog.js', 'crypto.js', 'stripe.js', 'sheets.js', 'app.js', 'index.js']) {
  cpSync(resolve(source, file), resolve(output, file));
}
for (const file of readdirSync(resolve(root, 'dist'))) {
  if (['.openai', 'server', 'client'].includes(file)) continue;
  cpSync(resolve(root, 'dist', file), resolve(assets, file), { recursive: true });
}
const hosting = JSON.parse(readFileSync(resolve(root, '.openai/hosting.json'), 'utf8'));
if (hosting.static) throw new Error('El Site debe usar Worker para verificar pagos.');
mkdirSync(resolve(root, 'dist/.openai'), { recursive: true });
writeFileSync(resolve(root, 'dist/.openai/hosting.json'), JSON.stringify(hosting, null, 2) + '\n');
