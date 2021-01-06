/**
 * 路由器模块
 * 
 * - 维护 fastify 应用实例
 * - 运行和管理所有路由
 */
import user from './user.js';
import auth from './auth.js';
import esac from './case.js';
import conf from './conf.js';
import file from './file.js';

export default function(app, {svc}) {
  app.register(function(app, opts, done) {
    // 用户
    user(app, {
      svcUser: svc.user
    });
    // 权限
    auth(app, {
      svcAuth: svc.auth
    });
    // 案例
    esac(app, {
      svcCase: svc.case
    });
    // 配置
    conf(app, {
      svcConf: svc.conf
    });
    // 文件
    file(app, {});

    app.all('/*', {
      handler(req, reply) {
        reply.badRequest('请求的接口不存在');
      }
    });

    done();
  }, {prefix: '/api'});
}
