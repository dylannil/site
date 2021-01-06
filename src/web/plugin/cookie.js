/**
 * 处理 cookie
 * 
 * app.parseCookie 接收参数 cookieHeader
 * req.cookies 对象
 * reply.setCookie 接收 name value options 支持 httpOnly signed
 * reply.clearCookie 接收 name options 支持 httpOnly
 * reply.unsignCookie 接收 value
 * 构造 onRequest 自动解析 cookieHeader 到 cookies
 */
import fastifyCookie from 'fastify-cookie';

export default function(app) {
  app.register(fastifyCookie, {secret: 'pei0ainooKahto'});
}