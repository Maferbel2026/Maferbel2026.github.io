import { createApp } from './app.js';

const handle = createApp();

export default {
  fetch(request, env) {
    if (!new URL(request.url).pathname.startsWith('/api/')) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('No encontrado.', { status: 404 });
    }
    return handle(request, env);
  },
};
