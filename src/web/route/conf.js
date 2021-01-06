/**
 * 配置路由表
 */

export default function(app, opts) {
  const {svcConf: svc} = opts;

  // GET /api/conf/:type
  const getConf = {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stamp: {type: 'number'}
            }
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        const type = req.params['type'];
        const ret = svc.getConfAllByType(type);
        return ret;
      } catch (e) {
        reply.badRequest(e);
      }
    }
  }

  // POST /api/conf/:type/*
  const setConf = {
    config: {auth: 'conf/set'},
    schema: {},
    async handler(req, reply) {
      try {
        const type = req.params['type'];
        if (type) {
          const vals = (req.params['*'] || '').split('/');
          svc.setConf(type, ...vals);
        } else {
          svc.setConf(req.body);
        }
        reply.send({message: '配置完成'});
      } catch (e) {
        reply.badRequest(e);
      }
    }
  }

  // 注册
  app.register(function (app, opts, done) {
    app.get('/:type', getConf);
    app.post('/', setConf);
    app.post('/:type/*', setConf);

    done();
  }, {prefix: '/conf'});
}
