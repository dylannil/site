
import boot from './boot/index.js';
import plugin from './plugin/index.js';
import route from './route/index.js';
import view from './view/index.js';

export default async function(opts) {
  const app = boot.new({
    name: "YearnIO Site",
    owner: "YearnIO",
    ...opts
  });
  await app.boot();
  await app.config(
    plugin.sensible,
    plugin.helmet,
    plugin.ratelimit,
    plugin.compress,
    plugin.cookie,
    plugin.jwt,
    plugin.csrf,
    plugin.health,
    plugin.multipart,
    plugin.auth,
    route,
    plugin.serveStatic,
    view,
  );
  app.listen('8128');
}
