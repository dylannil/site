/**
 * 压缩返回
 */
import fastifyCompress from 'fastify-compress';

export default function(app) {
  app.register(fastifyCompress, {
    global: true,
    encodings: ['gzip', 'deflate'],
    threshold: 1024, // 1KB
    customTypes: /text\/html/,
    zlibOptions: {level: 9}
  });
}