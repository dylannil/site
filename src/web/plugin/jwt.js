/**
 * JsonWebToken 处理
 * 
 * app.jwt.sign({})
 * app.jwt.verify({})
 * app.jwt.decode(token)
 * req.jwtVerify()
 * reply.jwtSign({})
 * {preValidation: [fastify.authenticate]}
 * 每次变更 secret 会导致之前所有的 token 失效
 * 
 * JWT 并不适合维护 session 数据
 * - session 信息一般含有不可忽略的数据量，反复在浏览器和服务器间传递，浪费太多带宽
 * - 过期信息缺乏更新机制，浏览器内的令牌成功更新前，发送的令牌内都是旧的信息
 * - 非 HttpOnly Cookie 方式传递，敏感信息，可以被存储在 localstorage 中，容易泄露和被盗用
 * - 已发放令牌，在过期前，不易作废，需要使用黑名单机制
 * 
 * 所以 JWT 内最好存放简单的非敏感信息，可以带上一个 session ID 用于定位真正的 session。
 * 而真正的 session 还是应该使用服务器内传统机制维护。
 * 对于分布式系统可以独立 session 服务器，为其他所有服务提供会话数据服务。
 * 
 * 如果 JWT 内只存放 session ID ，并通过传统 session 管理完整的会话的话，
 * 回看 JWT 内的 signature 认证就显的有点儿多余，毕竟 session 机制会认证 session ID 的有效性
 * 
 * 本项目使用 JWT 是因为没有复杂的 session 需要维护。
 * 
 * session 本质上仍然是一种缓存机制，已经登录的用户的常用数据缓存在 session 中，
 * 可以加快后续的调用，修改等操作。
 * 
 * 本项目，目前设计不考虑太复杂的用户操作，也不需要缓存用户基本数据，所以
 * 项目内不存在 session 机制，正好依托 JWT 的 signature 实现用户认证
 */
import fastifyJwt from 'fastify-jwt';

export default function(app) {
  app.register(fastifyJwt, {
    // 此密码只用来生成签名，并不会加密 payload 段数据
    secret: 'aiph8ohc6chohH',
    // 静态资源的加载，很难简洁地添加 Authorization 请求头
    // 所以还是使用 cookie 机制，自动处理，非第三方 cookie 还是可以使用的
    // 页面可以通过请求一个登录状态接口，以识别自身是否处在登录态
    cookie: {cookieName: 'Authorization'},
    // 令牌有效期 2 小时
    sign: {
      expiresIn: 2 * 60 * 60
      // expiresIn: 10
    },
    // // 每次执行完 JWT 标准的 verify 之后，执行此定制认证
    // trusted: async (req, decodedToken) => {
    //   const {auth} = req.context.config || {};
    //   console.log('##########', auth);
    //   return decodedToken;
    // }
  });
}