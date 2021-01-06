/**
 * 视图
 */
import path from 'path';
import fs from 'fs';
import alias from './alias.js';
import {genPage} from './gen.js';

export default function(app, opts) {
  app.register(function(app, {svc}, done) {
    app.get('/*', {
      config: {
        root: path.join(app.cwd, 'page')
      },
      async handler(req, reply) {
        const {root} = req.context.config;
        const ext = path.extname(req.params['*']);
        if (ext) {
          reply.sendFile(req.params['*'], root);
          return ;
        }

        const file = '.' + alias('/' + req.params['*']) + '.html';

        // 检查按需要执行服务端渲染
        if (await needGen(req, file, root)) {
          const stamp = Date.now();
          
          const url = new URL(
            (req.headers[':scheme'] || req.protocol) +
            '://' +
            (req.headers[':authority'] || req.headers.host) +
            (req.headers[':path'] || req.raw.url)
          );
          await genPage({
            href: url.href,
            file,
            dist: root,
            hash: null
          }, svc);

          reply.header('Site-View-Dur', Date.now() - stamp);
        }

        // 返回文件，使用 fastify-static 的配置选项
        reply.sendFile(file, root);
      }
    });
    done();
  }, opts);

  async function needGen(req, file, root) {
    let need = false;

    // 客户端忽略缓存刷新，强制重新生成
    if (!req.headers['if-none-match'] && !req.headers['if-modified-since']) {
      need = app.env === 'development' || req.enforce('default:static:rerender');
    }

    // 目标文件不存在，必须执行生成
    if (!need) {
      try {
        root && (file = path.join(root, file));
        const stats = await fs.promises.stat(file);
        need = !stats || !stats.isFile();
      } catch {
        need = true;
      }
    }

    return need;
  }
}