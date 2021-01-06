/**
 * 自定义鉴权插件
 * 
 * - 依赖 fastify-jwt 插件
 * 
 * 在 onRequest 钩子内执行鉴权操作，以在无权限时尽可能早的返回，
 * 而不是做各种多余的数据解析、数据验证等操作
 */
import fp from 'fastify-plugin';
import Errs from '../../err/index.js';
 
export default function(app, {svc}) {
  async function plugin(app, opts, next) {
    const enforcer = opts.svc;

    // 装饰
    app.decorate('enforce', function(sub, dom, obj, act) {
      if (dom && !obj && !act) {
        [act, obj, dom = 'default'] = dom.split('/').reverse();
      }
      return enforcer.enforce(sub, dom, obj, act);
    });
    app.decorateRequest('enforce', function(dom, obj, act) {
      if (!this.user || !this.user.id) {return false;}
      return app.enforce(this.user.id, dom, obj, act);
    });

    // 重签计时，避免并发过程中同一个令牌被多次重签
    const resign = {};

    // 鉴权
    // 尽量前置，在钩子 onRequest 环节解析令牌信息，按设置执行认证
    // 如果失败，不做后续的数据解析、数据验证、请求响应等等操作
    app.addHook('onRequest', async function (req, reply) {
      const {auth} = req.context.config || {};
      // auth 为 true 只解析，不做更多； auth 为字符串，则需要鉴权
      if (auth) {
        // 解析
        if (!req.user) {
          if (!req.jwtVerify) {throw new Errs.SE_WEB_NEED_JWT_PLUGIN('auth');}
          try {
            await req.jwtVerify();
            // 检查如果存在于黑名单，则视为无 token
            const token = req.cookies['Authorization'];
            const black = await svc.user.isTokenInBlackList(token);
            if (black) {throw new Error('无效令牌，已经加入黑名单');}
          } catch (e) {
            req.user = {err: e};
            // 清理 cookie
            reply.clearCookie('Authorization', {
              path: '/',
              secure: true,
              httpOnly: true,
              sameSite: true
            });
          }
        }
        // 鉴权
        if (typeof auth === 'string') {
          // 用户未登录，视为没有权限进行任何明文指定的操作
          if (!req.user || !req.user.id) {
            throw new Errs.SE_WEB_NEED_USER_LOGIN();
          }
          // 已登录用户通过 auth 服务鉴定其权限
          const ret = app.enforce(req.user.id, auth);
          if (!ret) {
            throw new Errs.SE_WEB_USER_NO_PERMISSION(req.user.id, auth);
          }
        }
        // 重签
        const now = Math.floor(Date.now() / 1000);
        if (req.user && req.user.exp && req.user.exp < now + 60) {
          // 有效期不足 60s 执行重签
          const {id, username} = req.user;
          // 30s 内，同一个 id 并发多个重签需求，只执行首次重签
          if (resign[id] && resign[id] >= now) {return ;}
          resign[id] = now + 30;
          // 重签，以 Cookie 形式返回
          const token = await reply.jwtSign({id, username});
          reply.setCookie('Authorization', token, {
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: true
          });
          // 延时清理，每 30s 内最多触发一次清理操作
          if (resign._timer && resign._timer > now - 30) {return ;}
          resign._timer = now;
          setTimeout(() => {
            const now = Math.floor(Date.now() / 1000);
            for (let id in resign) {
              if (id !== '_timer' && resign[id] <= now) {
                delete resign[id];
              }
            }
          }, 30000);
        }
      }
    });


    next();
  }

  app.register(fp(plugin, {
    fastify: '>=3',
    name: 'fastify-casbin'
  }), {svc: svc.auth});
}