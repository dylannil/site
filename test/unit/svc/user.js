/**
 * 用户服务
 */
import bcrypt from 'bcrypt';
import { expect } from 'chai';
import Errs from '../../../src/err/index.js';
import User from '../../../src/svc/user.js';

export default () => describe('用户服务', () => {

  async function runTest(api, ...args) {
    const dao = args.pop();
    const apis = {};
    const cases = {};
    for (let key in dao) {
      const [handler, ...items] = dao[key];
      apis[key] = handler;
      cases[key] = items;
    }
    
    try {
      const user = new User({dao: apis});
  
      const ret = await user[api](...args);
      return ret;
    } catch (e) {
      return e;
    } finally {
      for (let key in cases) {
        for (let i = 0, len = cases[key].length; i < len; i++) {
          expect(cases[key][i](apis[key])).to.be.true;
        }
      }
    }
  }

  async function bcryptHash(password) {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hashed) => {
        err ? reject(err) : resolve(hashed);
      });
    });
  }
  async function bcryptVerify(password, hashed) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hashed, (err, hashed) => {
        err ? reject(err) : resolve(hashed);
      });
    });
  }
  
  describe('用户登录和登出', () => {
    it('登录，需要用户名、密码，成功返回用户 ID', async () => {
      const data = {
        id: 10000,
        username: 'dummy',
        password: await bcryptHash('dummy')
      };

      const ret = await runTest('login', 'dummy', 'dummy', {
        getUserInfoByUsername: [
          sinon.stub().returns(data),
          daoApi => daoApi.calledOnceWith(data.username)
        ],
        runUpdateUserLastLogin: [
          sinon.spy(),
          daoApi => daoApi.calledOnceWith(data.id)
        ]
      });

      expect(ret).to.eql(10000);
    });
    it('登录，用户不存在，抛出错误', async () => {
      const err = await runTest('login', 'dummy', 'dummy', {
        getUserInfoByUsername: [
          sinon.stub().returns(null),
          daoApi => daoApi.calledOnceWith('dummy')
        ],
        runUpdateUserLastLogin: [
          sinon.spy(),
          daoApi => daoApi.notCalled
        ]
      });

      expect(err).to.be.instanceOf(Errs.SE_USER_NOT_EXIST);
    });
    it('登录，密码错误，抛出错误', async () => {
      const data = {
        id: 10000,
        username: 'dummy',
        password: await bcryptHash('dummy')
      };

      const err = await runTest('login', 'dummy', '12345', {
        getUserInfoByUsername: [
          sinon.stub().returns(data),
          daoApi => daoApi.calledOnceWith(data.username)
        ],
        runUpdateUserLastLogin: [
          sinon.spy(),
          daoApi => daoApi.notCalled
        ]
      });

      expect(err).to.be.instanceOf(Errs.SE_USER_PASSWORD_WRONG);
    });
    it('登出，传入令牌和超时时间，时间单位切换为秒，记入黑名单', async () => {
      const token = 'dummy';
      const exp = Date.now() + 60000;
      await runTest('logout', token, exp, {
        getTokenFromBlackList: [
          sinon.stub().returns(null),
          daoApi => daoApi.calledOnceWith(token)
        ],
        runInsertTokenToBlackList: [
          sinon.spy(),
          daoApi => daoApi.calledWith(token, Math.round(new Date(exp).getTime() / 1000))
        ]
      });
    });
    it('登出，未传入令牌，不做任何操作', async () => {
      await runTest('logout', {
        getTokenFromBlackList: [
          sinon.stub().returns(null),
          daoApi => daoApi.notCalled
        ],
        runInsertTokenToBlackList: [
          sinon.spy(),
          daoApi => daoApi.notCalled
        ]
      });
    });
    it('登出，令牌已经存在于黑名单，不再次记录', async () => {
      const token = 'dummy';
      const exp = Date.now() + 60000;
      await runTest('logout', token, exp, {
        getTokenFromBlackList: [
          sinon.stub().returns({token, expire: exp}),
          daoApi => daoApi.calledOnceWith(token)
        ],
        runInsertTokenToBlackList: [
          sinon.spy(),
          daoApi => daoApi.notCalled
        ]
      });
    });
    it('登出，令牌已经超时，不记入黑名单', async () => {
      const token = 'dummy';
      const exp = Date.now() - 60000;
      await runTest('logout', token, exp, {
        getTokenFromBlackList: [
          sinon.stub().returns(null),
          daoApi => daoApi.notCalled
        ],
        runInsertTokenToBlackList: [
          sinon.spy(),
          daoApi => daoApi.notCalled
        ]
      });
    });
  });
  describe('用户信息', () => {
    it('提取用户信息，需要给定 ID，不返回 password', async () => {
      const data = {
        id: 10000,
        username: 'dummy',
        password: 'dummy'
      };
      const ret = await runTest('getUserInfo', data.id, {
        getUserInfo: [
          sinon.stub().returns(data),
          daoApi => daoApi.calledOnceWith(data.id)
        ]
      });
      delete data.password;
      expect(ret).to.eql(data);
    });
    it('提取用户信息，没有给定 ID，返回一个错误', async () => {
      const err = await runTest('getUserInfo', {
        getUserInfo: [
          sinon.stub().returns(null),
          daoApi => daoApi.notCalled
        ]
      });
      expect(err).to.be.instanceOf(Errs.SE_SHOULD_NOT_EMPTY);
    });
    it('提取用户信息，用户不存在，返回 空', async () => {
      const ret = await runTest('getUserInfo', 10000, {
        getUserInfo: [
          sinon.stub().returns(null),
          daoApi => daoApi.calledOnceWith(10000)
        ]
      });
      expect(ret).to.be.null;
    });
  });
  describe('用户邮箱', () => {
    it('更新用户邮箱，用户替换联系邮箱', async () => {
      const id = 10000;
      const email = 'abc@gmail.com';

      const dao = {
        runUpdateMail: sinon.spy()
      };

      const user = new User({dao});

      await user.upmail(id, email);

      expect(dao.runUpdateMail.calledOnceWith(id, email)).to.be.true;
    });
  });
  describe('邀请和注册', () => {
    it('生成一个邀请码，并返回', async () => {
      let inviteCode;
      const dao = {
        runInsertInviteCode: sinon.stub().callsFake(code => {
          inviteCode = code;
        })
      };

      const user = new User({dao});

      const code = await user.invite();

      expect(dao.runInsertInviteCode.calledOnce()).to.be.true;
      expect(code).to.equal(inviteCode);
    });
    it('清理过期邀请码', async () => {
      const dao = {
        runClearInviteCode: sinon.spy()
      };

      const user = new User({dao});

      await user.inviteClear();

      expect(dao.runClearInviteCode.calledOnce()).to.be.true;
    });
    it('注册新用户，需提供邀请码、用户名、密码、邮箱', async () => {
      const passcode = 'dummy';
      const username = 'dummy';
      const password = 'dummy';
      const email = 'dummy@dummy.com';

      let userData;

      const dao = {
        getInviteCode: sinon.stub().callsFake(code => {
          return {
            code,
            createdAt: Math.round(Date.now() / 1000) - 60 // 模拟 1 分钟前创建的邀请码
          };
        }),
        runDeleteInviteCode: sinon.spy(),
        getUserInfoByUsername: sinon.stub().returns(null),
        runInsertNewUser: sinon.stub().callsFake(data => {
          userData = data;
        })
      };

      const user = new User({dao});

      await user.signup(passcode, username, password, email);

      expect(dao.getInviteCode.calledOnce()).to.be.true;
      expect(dao.getUserInfoByUsername.calledOnceWith(username)).to.be.true;
      expect(dao.runInsertNewUser.calledOnce()).to.be.true;
      expect(dao.runDeleteInviteCode.calledOnceWith(passcode)).to.be.true;

      const ret = await new Promise((resolve, reject) => {
        bcrypt.compare(password, ret.password, (err, result) => {
          err ? reject(err) : resolve(result);
        });
      });
      expect(ret).to.be.true;
    });
    it('提供的邀请码不存在，注册失败', async () => {
      // app.register(function(app, opts, next) {
      //   user.init(app.db, app.knex);
      //   app.post('/signup', user.signup);
      //   next();
      // }, {prefix: '/api/user'});

      // const res = await app.inject({
      //   method: 'POST',
      //   url: '/api/user/signup',
      //   payload: {
      //     passcode: app.cypher(),
      //     username: 'dummy',
      //     password: await hash('dummy'),
      //     email: 'dummy@gmail.com'
      //   }
      // });
      // expect(res.statusCode).to.equal(400);
    });
    it('提供的用户名已经存在，注册失败', async () => {
      // app.register(function(app, opts, next) {
      //   user.init(app.db, app.knex);
      //   app.post('/login', user.login);
      //   app.post('/signup', user.signup);
      //   app.post('/invite', user.invite);
      //   next();
      // }, {prefix: '/api/user'});
      // const cookie = await login('muhonglong', '112358');
      // const res0 = await app.inject({
      //   method: 'POST',
      //   url: '/api/user/invite',
      //   cookies: {
      //     Authorization: cookie.value
      //   }
      // });
      // expect(res0.statusCode).to.equal(200);
      // const json = res0.json();
      // expect(json).to.have.property('code');
      // const passcode = json.code;

      // await app.inject({
      //   method: 'POST',
      //   url: '/api/user/signup',
      //   payload: {
      //     passcode,
      //     username: 'dummy',
      //     password: await hash('dummy'),
      //     email: 'dummy@gmail.com'
      //   }
      // });

      // const res = await app.inject({
      //   method: 'POST',
      //   url: '/api/user/signup',
      //   payload: {
      //     passcode,
      //     username: 'dummy',
      //     password: await hash('dummy'),
      //     email: 'dummy@gmail.com'
      //   }
      // });
      // expect(res.statusCode).to.equal(400);
    });
  });
  describe('密码管理', () => {
    it('用户自行更新密码', async () => {
      // app.register(function(app, opts, next) {
      //   user.init(app.db, app.knex);
      //   app.post('/login', user.login);
      //   app.post('/uppass', user.uppass);
      //   next();
      // }, {prefix: '/api/user'});
      // const cookie = await login('muhonglong', '112358');

      // const res = await app.inject({
      //   method: 'POST',
      //   url: '/api/user/uppass',
      //   payload: {
      //     password: await hash('112358'),
      //     password1: await hash('dummy')
      //   },
      //   cookies: {Authorization: cookie.value}
      // });
      // expect(res.statusCode).to.equal(200);

      // const cookie2 = await login('muhonglong', 'dummy');
      // expect(cookie2).to.have.property('value');
    });
    it('用户忘记密码，申请密码重置，发送邮件，使用重置工单修改密码', async () => {
      // app.register(function(app, opts, next) {
      //   user.init(app.db, app.knex);
      //   app.post('/login', user.login);
      //   app.post('/unpass', user.unpass);
      //   app.post('/rnpass', user.rnpass);
      //   next();
      // }, {prefix: '/api/user'});

      // await app.after();

      // let passcode;
      
      // // 打桩替换
      // const stub = sinon.stub(app.nodemailer, 'sendMail');
      // stub.callsFake(opts => {
      //   passcode = opts.text.match(/code=([\w\W]+)\s/)[1];
      //   return Promise.resolve(0);
      // });

      // // 申请重置
      // const res0 = await app.inject({
      //   method: 'POST',
      //   url: '/api/user/unpass',
      //   payload: {
      //     username: 'muhonglong',
      //     email: 'xiaoboleee@gmail.com'
      //   }
      // });
      // expect(res0.statusCode).to.equal(200);

      // // 密码置换
      // const res1 = await app.inject({
      //   method: 'POST',
      //   url: '/api/user/rnpass',
      //   payload: {
      //     passcode,
      //     password: await hash('dummy')
      //   }
      // });
      // expect(res1.statusCode).to.equal(200);

      // stub.restore();

      // const cookie = await login('muhonglong', 'dummy');
      // expect(cookie).to.have.property('value');
    });
  });
  describe('密码管理', () => {
    it('用户自行更新密码', async () => {
      // app.register(function(app, opts, next) {
      //   user.init(app.db, app.knex);
      //   app.post('/login', user.login);
      //   app.get('/perm/:obj/:act', user.verifyPerm);
      //   app.get('/perm/:dom/:obj/:act', user.verifyPerm);
      //   next();
      // }, {prefix: '/api/user'});
      // const cookie = await login('muhonglong', '112358');

      // const res0 = await app.inject({
      //   method: 'GET',
      //   url: '/api/user/perm/system/config/mng',
      //   cookies: {Authorization: cookie.value}
      // });
      // expect(res0.statusCode).to.equal(200);
      // expect(res0.body).to.equal('true');

      // const res1 = await app.inject({
      //   method: 'GET',
      //   url: '/api/user/perm/config/mng',
      //   cookies: {Authorization: cookie.value}
      // });
      // expect(res1.statusCode).to.equal(200);
      // expect(res1.body).to.equal('true');
    });
  });
});