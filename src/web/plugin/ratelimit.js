/**
 * 访问频率限制
 * 
 * 任意一个 IP 连续请求超过 100 次，暂停一分钟响应
 */
import fastifyRateLimit from 'fastify-rate-limit';

export default function(app) {
  app.register(fastifyRateLimit, {
    max: app.env === 'development' ? 100000 : 100,
    timeWindow: 60000,
    whitelist: ['127.0.0.1', 'localhost']
  });
}