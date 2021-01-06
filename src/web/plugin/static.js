/**
 * 静态资源服务
 */
import path from 'path';
import fastifyStatic from 'fastify-static';

export default function(app) {
  app.register(fastifyStatic, {
    root: path.join(app.cwd, 'pub'),
    prefix: '/',
    wildcard: false, // 静态匹配 pub 下的资源，使用 glob
    decorateReply: true,
    immutable: true,
    maxAge: '30 days'
  });
  app.register(fastifyStatic, {
    root: path.join(app.cwd, 'file'),
    prefix: '/file/',
    extensions: [],
    wildcard: true, // 动态匹配 post 目录下的资源
    decorateReply: false,
    immutable: true,
    maxAge: '30 days'
  });
}