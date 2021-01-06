/**
 * 案例路由表
 */
export default function(app, opts) {
  const {svcCase: svc} = opts;

  // GET /api/case 获取现有案例清单
  const getCaseList = {
    config: {auth: true},
    schema: {
      response: {
        // 200: {
        //   type: 'object',
        //   properties: {
        //     username: {type: 'string'},
        //     email: {type: 'string', format: 'email'},
        //     verifiedAt: {type: ['integer', 'null']},
        //     createdAt: {type: 'integer'},
        //     lastLogin: {type: ['integer', 'null']}
        //   }
        // }
      }
    },
    async handler(req, reply) {
      const {stamp} = req.query || {};
  
      const list = await svc.getAllCases(stamp, req.enforce('case/admin'));
  
      reply.send(list);
    }
  }
  
  // POST /api/case 创建新的案例
  const setCase = {
    config: {auth: 'case/create'},
    schema: {
      body: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          type: {type: 'string'},
          desc: {type: 'string'},
          word: {type: 'string'},
          link: {type: 'string'},
          img: {type: 'string'}
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: {type: 'number'},
            name: {type: 'string'},
            type: {type: 'string'},
            desc: {type: 'string'},
            word: {type: 'string'},
            link: {type: 'string'},
            img: {type: 'string'},
            able: {type: 'boolean'},
            createdAt: {type: 'number'},
            updatedAt: {type: 'number'}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        const esca = await svc.setCase(req.body);
        esca.able = esca.able === 1;
        reply.send(esca);
      } catch (e) {
        reply.badRequest(e.message);
      }
    }
  }

  // DELETE /api/case 删除案例
  const delCase = {
    config: {auth: 'case/delete'},
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            message: {type: 'string'}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        await svc.delCase(req.body.id);
        reply.send({message: '删除完成'});
      } catch (e) {
        reply.badRequest(e.message);
      }
    }
  }

  // POST /api/case/able 切换案例可否公开
  const toggleCaseAble = {
    config: {auth: 'case/toggle'},
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            able: {type: 'boolean'}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        const ret = await svc.toggleCaseAble(req.body.id);
        reply.send({able: ret === 1});
      } catch (e) {
        reply.badRequest(e.message);
      }
    }
  }

  // 注册
  app.register(function (app, opts, done) {
    app.get('/', getCaseList);
    app.post('/', setCase);
    app.post('/able', toggleCaseAble);
    app.delete('/', delCase);
    done();
  }, {prefix: '/case'});
}
