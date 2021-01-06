/**
 * 防 CSRF
 * 
 * CSRF 攻击一般是第三方网站盗用 cookie
 * - 设置 cookie 的 sameSite 可以禁止第三方网站访问 cookie
 * - 校验 referer 头可以选择禁止发起者为第三方网站的请求
 * - 还可以附加 token 用以增加伪造难度， cookie 和 token 同时被盗的可能性基地
 * 此插件就是用于生成和校验上述 token 的功能
 * 默认依赖 fastify-cookie 维持 secret
 * - reply.generateCsrf(opts) 生成 token 需要手动传递给客户端
 * - app.csrfProtection(req, reply, next) 手动验证客户端回传的 token
 * 如果在表单中自动请求得到一个 token 并以 _csrf 为字段名协同整个表单提交
 * 收到提交的服务就可以通过该 token 分析是否受到 CSRF 攻击了
 * 最终效果：
 * - 每次提交之前先请求 csrf token 生成接口得到 token
 * - 然后以 _csrf 为字段名，合并到提交数据内一起提交
 * - 服务端提取 _csrf 进行校验通过后，执行相关操作
 * 也可以在登录后下发一个 token 后续用户的操作都需要带上此 token
 */
import fastifyCsrf from 'fastify-csrf';

export default function(app) {
  app.register(fastifyCsrf, {
    cookieKey: 'x-sec-affix',
    cookieOpts: {path: '/', sameSite: true, httpOnly: true}
  });
}