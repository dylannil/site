/**
 * 用户路由表
 */

export default function(app, opts) {
  const {svcUser: svc} = opts;
  
  // GET /api/user
  // - 当前登录的用户的信息
  const getUserInfo = {
    config: {auth: true},
    schema: {
      response: {
        200: {
          type: 'object',
          nullable: true,
          properties: {
            username: {type: 'string'},
            email: {type: 'string', format: 'email'},
            verifiedAt: {type: 'integer'},
            createdAt: {type: 'integer'},
            lastLogin: {type: 'integer'}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        const {id} = req.user || {};
        const ret = await svc.getUserInfo(id);
        reply.send(ret);
      } catch (e) {
        switch (e.code) {
          case 'SE_SHOULD_NOT_EMPTY':
            reply.code(200);
            reply.send(null);
            break;
          default:
            reply.send({message: e.message});
        }
      }
    }
  }

  // GET /api/user/identity 检查页面是否处在某个用户已登录状态
  const getUserIdentity = {
    config: {auth: true},
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: {type: 'integer'},
            username: {type: 'string'},
            exp: {type: 'number'}
          }
        }
      }
    },
    async handler(req, reply) {
      const {id, username, exp} = req.user || {};
      if (!id) {
        return reply.send({});
      } else {
        return reply.send({id, username, exp});
      }
    }
  }
  
  // POST /api/user/login 使用用户名和密码登录
  const login = {
    config: {
      // 同一个 IP 在 1min 内只能发送三次 登录 请求
      rateLimit: app.env === 'production' ? {max: 3, timeWindow: 60000} : undefined
    },
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {type: 'string', maxLength: 15, minLength: 4},
          password: {type: 'string', maxLength: 64, minLength: 64},
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: {type: 'integer'},
            username: {type: 'string'},
            exp: {type: 'number'}
          }
        },
        400: {
          type: 'object',
          properties: {
            code: {type: 'string'},
            message: {type: 'string'}
          }
        }
      }
    },
    async handler(req, reply) {
      try {
        const {username, password} = req.body;
        
        const id = await svc.login(username, password);
  
        // 签发 token
        // 使用 Cookie 以确保静态资源的请求上也带有认证信息
        // 即将过期的 token 可以被重签，需要做一下延时，避免一个 token 被重签多次
        const token = await reply.jwtSign({id, username});
        reply.setCookie('Authorization', token, {
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: true
        });

        const payload = Buffer.from(token.split('.')[1], 'base64');
        const {exp} = JSON.parse(payload.toString());
  
        // 返回用户状态信息，表示是否登录
        reply.send({id, username, exp});
      } catch (e) {
        switch (e.code) {
          case 'SE_USER_NOT_EXIST':
          case 'SE_USER_PASSWORD_WRONG':
            reply.code(400);
            return reply.send({code: e.code, message: e.message});
          default:
            throw e;
        }
      }
    }
  }
  
  // ALL /api/user/logout 已登录用户退出登录
  const logout = {
    async handler(req, reply) {
      const token = req.cookies['Authorization'];
      token && req.jwtVerify().then(() => {
        svc.logout(token, req.user.exp);
      }).catch(e => {
        console.error(e);
      });
      
      reply.clearCookie('Authorization', {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: true
      });
      reply.send({msg: '退出登录完成'});
    }
  }

  // DELETE /api/user/black/expire 清理所有过期的黑名单记录
  const delExpiredBlackList = {
    async handler(req, reply) {
      svc.clearBlackList();
      reply.send({msg: '黑名单清理完成'});
    }
  }
  
  // POST /api/user/signup 使用邀请码注册新用户
  const signup = {
    body: {
      type: 'object',
      required: ['username', 'password', 'passcode', 'email'],
      properties: {
        username: {type: 'string', maxLength: 25, minLength: 5},
        password: {type: 'string', maxLength: 64, minLength: 64},
        passcode: {type: 'string', maxLength: 64, minLength: 64},
        email: {type: 'string', format: 'email'},
      }
    },
    async handler(req, reply) {
      const {username, password, passcode, email} = req.body;

      svc.signup(username, password, passcode, email);
  
      // 返回用户信息
      reply.send('ok');
    }
  }
  
  // POST /api/user/unpass 创建密码重置工单
  const unpass = {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email'],
        properties: {
          username: {type: 'string', maxLength: 25, minLength: 5},
          email: {type: 'string', format: 'email'},
        }
      }
    },
    async handler(req, reply) {
      const {username, email} = req.body;
  
      svc.unpass(username, email);

      // 返回
      reply.send('ok');
    }
  }
  
  // POST /api/user/rnpass 使用重置码重置密码
  const rnpass = {
    config: {},
    schema: {
      body: {
        type: 'object',
        properties: {
          passcode: {type: 'string', minLength: 10, maxLength: 10},
          password: {type: 'string', minLength: 64, maxLength: 64}
        }
      }
    },
    async handler(req, reply) {
      const {password, passcode} = req.body;

      svc.rnpass(passcode, password);
  
      // 返回
      reply.send('ok');
    }
  }
  
  // POST /api/user/uppass 登录用户更新密码
  const uppass = {
    config: {auth: true},
    schema: {
      body: {
        type: 'object',
        properties: {
          password: {type: 'string', minLength: 64, maxLength: 64},
          password1: {type: 'string', minLength: 64, maxLength: 64},
        }
      }
    },
    async handler(req, reply) {
      const {id} = req.user;
      const {password, password1} = req.body;

      await svc.uppass(id, password, password1);
  
      // 返回
      reply.send({msg: '密码修改完成'});
    }
  }
  
  // POST /api/user/unmail 申请发送邮箱验证邮件
  const unmail = {
    config: {auth: true},
    schema: {
    },
    async handler(req, reply) {
      const {id} = req.user;
  
      svc.unmail(id);

      // 返回
      reply.send('ok');
    }
  }
  // POST /api/user/rnmail 更新邮箱验证状态
  const rnmail = {
    config: {},
    schema: {
      body: {
        type: 'object',
        properties: {
          passcode: {type: 'string', minLength: 10, maxLength: 10}
        }
      }
    },
    async handler(req, reply) {
      const {passcode} = req.body;

      svc.rnmail(passcode);
  
      // 返回
      reply.send('ok');
    }
  }
  // POST /api/user/upmail 邮箱更新，并重置状态为未认证
  const upmail = {
    config: {auth: true},
    schema: {
      body: {
        type: 'object',
        properties: {
          email: {type: 'string', format: 'email'},
        }
      }
    },
    async handler(req, reply) {
      const {id} = req.user;
      const {email} = req.body;

      await svc.upmail(id, email);
  
      // 返回
      reply.send({message: '更新邮箱完成'});
    }
  }


  // POST /api/user/upname 邮箱更新，并重置状态为未认证
  const upname = {
    config: {auth: true},
    schema: {
      body: {
        type: 'object',
        properties: {
          username: {type: 'string', maxLength: 15, minLength: 4}
        }
      }
    },
    async handler(req, reply) {
      const {id} = req.user;
      const {username} = req.body;

      await svc.upname(id, username);
  
      // 返回
      reply.send({message: '更新用户名完成'});
    }
  }
  
  // POST /api/user/invite 管理员生成并返回邀请码，由管理员人工发送以邀请
  const invite = {
    config: {auth: 'system:admin:invite'},
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            code: {type: 'string'},
            createdAt: {type: 'integer'}
          }
        }
      }
    },
    async handler(req, reply) {

      const ret = svc.createInviteCode();
  
      reply.send(ret);
    }
  }
  // GET /api/user/invite 管理员获取当前可用的邀请码
  const allInvited = {
    config: {auth: 'system:admin:invite'},
    schema: {
      response: {
        200: {
          type: 'array',
          item: {
            type: 'object',
            properties: {
              code: {type: 'string'},
              createdAt: {type: 'integer'}
            }
          }
        }
      }
    },
    async handler(req, reply) {
      const list = svc.getAllInviteCode();
      // 返回
      reply.send(list);
    }
  }

  
  // // GET /api/user/perm/:obj/:act 用户判断自身是否有对应的权限
  // // GET /api/user/perm/:dom/:obj/:act 用户判断自身是否有对应的权限
  // const verifyPerm = {
  //   config: {auth: true},
  //   schema: {
  //     response: {
  //       200: {
  //         type: 'boolean'
  //       }
  //     }
  //   },
  //   async handler(req, reply) {
  //     const {id} = req.user || {};
  //     const {dom = 'default', obj, act} = req.params || {};
  
  //     const ret = svc.enforce(id, dom, obj, act);
      
  //     reply.send(ret);
  //   }
  // }

  // 注册
  app.register(function (app, opts, done) {
    app.get('/', getUserInfo);
    app.get('/identity', getUserIdentity);

    app.post('/login', login);
    app.all('/logout', logout);
    app.post('/signup', signup);

    app.post('/unpass', unpass);
    app.post('/rnpass', rnpass);
    app.post('/uppass', uppass);

    app.post('/unmail', unmail);
    app.post('/rnmail', rnmail);
    app.post('/upmail', upmail);

    app.post('/upname', upname);

    app.post('/invite', invite);
    app.get('/invite', allInvited);

    app.delete('/black/expire', delExpiredBlackList);

    // app.get('/perm/board', verifyPermBoard);
    // app.get('/perm/:obj/:act', verifyPerm);
    // app.get('/perm/:dom/:obj/:act', verifyPerm);
    done();
  }, {prefix: '/user'});
}
