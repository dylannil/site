/**
 * 常用功能扩展
 * 
 * app.httpErrors.notFound 可以直接抛出
 * reply.notFound() 自行抛出
 * reply.vary('Accept') 引入 jshttp/vary 操作返回头 Vary 信息
 * req.forwarded() 引入 jshttp/forwarded 解析 X-Forwarded-For
 * req.is(['html', 'json']) 引入 jshttp/type-is 用于检查请求类型
 * app.assert() 等用于验证数据
 * app.to 引入 await-to-js 便于异步错误处理
 */
import fastifySensible from 'fastify-sensible';

export default function(app) {
  app.register(fastifySensible);
}