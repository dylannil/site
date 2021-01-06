/**
 * 健康检查
 * 
 * 引入了 under-pressure 并支持其所有配置
 */
import fastifyHealthcheck from 'fastify-healthcheck';

export default function(app) {
  app.register(fastifyHealthcheck, {
    healthcheckUrlDisable: false, // 不公开接口
    healthcheckUrl: '/health', // 接口路径
    healthcheckUrlAlwaysFail: false, // 是否一直返回 500
    exposeUptime: true // 返回服务运行时间
  });
}