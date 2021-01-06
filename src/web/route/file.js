/**
 * 帖子路由表
 */
import stream from 'stream';
import crypto from 'crypto';
import util from 'util';
import path from 'path';
import fs from 'fs';

export default function(app, opts) {
  // POST /api/file
  // POST /api/file/*
  // - 文件上传接收
  const upload = {
    config: {auth: true},
    schema: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {type: 'string'},
            file: {type: 'string', maxLength: 13, minLength: 8}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        const dir = req.params['*'] || 'asset';
        const base = path.join(app.cwd, 'file', dir);
        await fs.promises.mkdir(base, {recursive: true});

        const ret = [];

        const files = await req.files();
        for await (const file of files) {
          const target = path.join(base, file.filename);
          const save = fs.createWriteStream(target);
          const hash = crypto.createHash('md5');

          file.file.on('data', chunk => {
            hash.update(chunk);
          });
          file.file.on('end', chunk => {
            chunk && hash.update(chunk);
          });

          await util.promisify(stream.pipeline)(file.file, save);

          // 也可以使用复制流的方式，crypto.createHash 返回的正是一个流
          // const tasks = [
          //   new Promise((resolve, reject) => {
          //     stream.pipeline(file.file, save, err => {
          //       err ? reject(err) : resolve();
          //     });
          //   }),
          //   new Promise((resolve, reject) => {
          //     stream.pipeline(file.file, hash, err => {
          //       err ? reject(err) : resolve();
          //     });
          //   })
          // ];
          // for await (const ret of tasks) {}

          const hashed = hash.digest('hex').slice(0, 8) + path.extname(file.filename);

          ret.push({name: file.fieldname, file: hashed});

          const filename = path.join(base, hashed);
          await fs.promises.rename(target, filename);
        }

        reply.send(ret);
      } catch (e) {
        console.error(e);
        reply.send('error');
      }
    }
  }

  // 注册
  app.register(function (app, opts, done) {
    app.post('/*', upload);
    app.post('/', upload);
    done();
  }, {prefix: '/file'});
}
