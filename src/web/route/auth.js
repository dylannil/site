/**
 * 帖子路由表
 */

export default function(app, opts) {
  const {svcAuth: svc} = opts;
  
  // GET /api/auth
  const getAuthAll = {
    config: {auth: true},
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            auth: {type: 'boolean'}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        await svc.getAuthAll(id);
      } catch (e) {
        reply.badRequest(e);
      }
    }
  }

  // GET /api/auth/*
  // - 检查当前用户对某项资源是否有某操作的权限
  // - 检查指定用户对某项资源是否有某操作的权限
  const getAuth = {
    config: {auth: true},
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            auth: {type: 'boolean'}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        const {id} = req.user || {};
        const str = req.params['*'];
        // if (link) {
        //   const item = await svc.getAuthFromLink(link);
        //   reply.send([item]);
        // } else {
        //   const list = await svc.getList({uid: id});
        //   reply.send(list);
        // }
      } catch (e) {
        reply.badRequest(e);
      }
    }
  }

  // GET /api/auth/board 前端用户面板各页面的权限
  const getAuthBoard = {
    config: {auth: true},
    schema: {
      responses: {
        200: {
          type: 'object',
          properties: {
            user: {type: 'boolean', default: false},
            // post: {type: 'boolean', default: false},
            case: {type: 'boolean', default: false},
            // rank: {type: 'boolean', default: false}
          }
        }
      }
    },
    async handler(req, reply) {
      const {id} = req.user || {};
      reply.send({
        user: id && (await svc.enforce(id, 'board', 'user', 'edit')),
        // post: id && (await svc.enforce(id, 'board', 'post', 'edit')),
        case: id && (await svc.enforce(id, 'board', 'case', 'edit')),
        // rank: id && (await svc.enforce(id, 'board', 'rank', 'edit'))
      });
    }
  }


  // PUT /api/auth
  // - 重新扫描所有帖子源码建立索引，返回统计
  const setAuth = {
    schema: {},
    config: {auth: true},
    async handler(req, reply) {
      // const {id} = req.user || {};
      // if (!id) {
      //   return reply.send({
      //     username: 'guest'
      //   });
      // }

      try {
        const data = await svc.scanPost();
        reply.send(data);
      } catch (e) {
        console.log(e);
        reply.send('error');
      }
    }
  }

  // 注册
  app.register(function (app, opts, done) {
    app.get('/board', getAuthBoard);
    app.get('/', getAuthAll);
    app.get('/*', getAuth);
    app.post('/', setAuth);

    // app.post('/role', ...routes.addRole);
    // app.delete('/role', ...routes.delRole);
    // app.post('/policy', ...routes.addPolicy);
    // app.delete('/policy', ...routes.delPolicy);
    // app.get('/policy', ...routes.getAllPolicies);
    done();
  }, {prefix: '/auth'});
}
