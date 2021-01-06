/**
 * 用户管理
 */
import sinon from 'sinon';
import { expect } from 'chai';
import hash from '../../pub/core/util/hash.js'
import {newFastify} from '../router/index.js';
import * as user from './index.js';

describe('用户', () => {
  let app;
  async function login(username, password) {
    const res = await app.inject({
      method: 'POST',
      url: '/api/user/login',
      payload: {
        username: username,
        password: await hash(password)
      }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.json()).to.include({username});

    let cookie;
    expect(res.cookies).to.satisfy(list => list.some(it => {
      if (it.name === 'Authorization') {
        cookie = it
        return true;
      }
    }));
    return cookie;
  }
  beforeEach(() => {
    app = newFastify();
  });
  describe('登录和登出', () => {
    it('提供用户名、密码，实现登录', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');
      expect(cookie).to.have.property('value');
    });
    it('已经登录的用户登出', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        app.all('/logout', user.logout);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');
      
      const res = await app.inject({
        method: 'GET',
        url: '/api/user/logout',
        cookies: {Authorization: cookie.value}
      });
      expect(res.statusCode).to.equal(200);
      let cookie2;
      expect(res.cookies).to.satisfy(list => list.some(it => {
        if (it.name === 'Authorization') {
          cookie2 = it;
          return true;
        }
      }));
      expect(cookie2.expires <= new Date()).to.be.true;
    });
  });
  describe('用户信息', () => {
    it('已登录用户通过接口请求用户信息', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.get('/', user.getInfo);
        app.post('/login', user.login);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');
      
      const ret = await app.inject({
        method: 'GET',
        url: '/api/user',
        cookies: {Authorization: cookie.value}
      });
      expect(ret.statusCode).to.equal(200);
      expect(ret.json())
        .to.include({username: 'muhonglong', email: 'xiaoboleee@gmail.com'})
        .to.have.property('createdAt');
    });
    it('未登录的用户请求用户信息返回错误', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.get('/', user.getInfo);
        next();
      }, {prefix: '/api/user'});
      
      const ret = await app.inject({
        method: 'GET',
        url: '/api/user',
      });
      expect(ret.statusCode).to.equal(400);
    });
    it('未验证邮箱发送邮件进行验证，替换邮箱重置未验证', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.get('/', user.getInfo);
        app.post('/login', user.login);
        app.post('/unmail', user.unmail);
        app.post('/rnmail', user.rnmail);
        app.post('/upmail', user.upmail);
        next();
      }, {prefix: '/api/user'});

      await app.after();

      const cookie = await login('muhonglong', '112358');
      expect(cookie).to.have.property('value');

      let passcode;
      
      // 打桩替换
      const stub = sinon.stub(app.nodemailer, 'sendMail');
      stub.callsFake(opts => {
        passcode = opts.text.match(/code=([\w\W]+)\s/)[1];
        return Promise.resolve(0);
      });

      // 申请验证
      const res0 = await app.inject({
        method: 'POST',
        url: '/api/user/unmail',
        cookies: {Authorization: cookie.value}
      });
      expect(res0.statusCode).to.equal(200);

      // 执行验证
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/user/rnmail',
        payload: {
          passcode
        }
      });
      expect(res1.statusCode).to.equal(200);

      stub.restore();

      // 
      const res2 = await app.inject({
        method: 'GET',
        url: '/api/user',
        cookies: {Authorization: cookie.value}
      });
      expect(res2.statusCode).to.equal(200);
      expect(res2.json().verifiedAt).to.be.not.null;

      const res3 = await app.inject({
        method: 'POST',
        url: '/api/user/upmail',
        payload: {email: 'demo@gmail.com'},
        cookies: {Authorization: cookie.value}
      });
      expect(res3.statusCode).to.equal(200);

      // 
      const res4 = await app.inject({
        method: 'GET',
        url: '/api/user',
        cookies: {Authorization: cookie.value}
      });
      expect(res4.statusCode).to.equal(200);
      const json = res4.json();
      expect(json.verifiedAt).to.be.null;
    });
  });
  describe('邀请和注册', () => {
    it('生成一个邀请码，存储并返回', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        app.post('/invite', user.invite);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');
      const res = await app.inject({
        method: 'POST',
        url: '/api/user/invite',
        cookies: {
          Authorization: cookie.value
        }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.json()).to.have.property('code');
    });
    it('提供邀请码、用户名、密码、邮箱，存储到数据库', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        app.post('/signup', user.signup);
        app.post('/invite', user.invite);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');
      const res0 = await app.inject({
        method: 'POST',
        url: '/api/user/invite',
        cookies: {
          Authorization: cookie.value
        }
      });
      expect(res0.statusCode).to.equal(200);
      const json = res0.json();
      expect(json).to.have.property('code');
      const passcode = json.code;

      await app.inject({
        method: 'POST',
        url: '/api/user/signup',
        payload: {
          passcode,
          username: 'dummy',
          password: await hash('dummy'),
          email: 'dummy@gmail.com'
        }
      });
      const cookie2 = await login('dummy', 'dummy');
      expect(cookie2).to.have.property('value');
    });
    it('提供的邀请码不存在，注册失败', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/signup', user.signup);
        next();
      }, {prefix: '/api/user'});

      const res = await app.inject({
        method: 'POST',
        url: '/api/user/signup',
        payload: {
          passcode: app.cypher(),
          username: 'dummy',
          password: await hash('dummy'),
          email: 'dummy@gmail.com'
        }
      });
      expect(res.statusCode).to.equal(400);
    });
    it('提供的用户名已经存在，注册失败', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        app.post('/signup', user.signup);
        app.post('/invite', user.invite);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');
      const res0 = await app.inject({
        method: 'POST',
        url: '/api/user/invite',
        cookies: {
          Authorization: cookie.value
        }
      });
      expect(res0.statusCode).to.equal(200);
      const json = res0.json();
      expect(json).to.have.property('code');
      const passcode = json.code;

      await app.inject({
        method: 'POST',
        url: '/api/user/signup',
        payload: {
          passcode,
          username: 'dummy',
          password: await hash('dummy'),
          email: 'dummy@gmail.com'
        }
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/user/signup',
        payload: {
          passcode,
          username: 'dummy',
          password: await hash('dummy'),
          email: 'dummy@gmail.com'
        }
      });
      expect(res.statusCode).to.equal(400);
    });
  });
  describe('密码管理', () => {
    it('用户自行更新密码', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        app.post('/uppass', user.uppass);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');

      const res = await app.inject({
        method: 'POST',
        url: '/api/user/uppass',
        payload: {
          password: await hash('112358'),
          password1: await hash('dummy')
        },
        cookies: {Authorization: cookie.value}
      });
      expect(res.statusCode).to.equal(200);

      const cookie2 = await login('muhonglong', 'dummy');
      expect(cookie2).to.have.property('value');
    });
    it('用户忘记密码，申请密码重置，发送邮件，使用重置工单修改密码', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        app.post('/unpass', user.unpass);
        app.post('/rnpass', user.rnpass);
        next();
      }, {prefix: '/api/user'});

      await app.after();

      let passcode;
      
      // 打桩替换
      const stub = sinon.stub(app.nodemailer, 'sendMail');
      stub.callsFake(opts => {
        passcode = opts.text.match(/code=([\w\W]+)\s/)[1];
        return Promise.resolve(0);
      });

      // 申请重置
      const res0 = await app.inject({
        method: 'POST',
        url: '/api/user/unpass',
        payload: {
          username: 'muhonglong',
          email: 'xiaoboleee@gmail.com'
        }
      });
      expect(res0.statusCode).to.equal(200);

      // 密码置换
      const res1 = await app.inject({
        method: 'POST',
        url: '/api/user/rnpass',
        payload: {
          passcode,
          password: await hash('dummy')
        }
      });
      expect(res1.statusCode).to.equal(200);

      stub.restore();

      const cookie = await login('muhonglong', 'dummy');
      expect(cookie).to.have.property('value');
    });
  });
  describe('密码管理', () => {
    it('用户自行更新密码', async () => {
      app.register(function(app, opts, next) {
        user.init(app.db, app.knex);
        app.post('/login', user.login);
        app.get('/perm/:obj/:act', user.verifyPerm);
        app.get('/perm/:dom/:obj/:act', user.verifyPerm);
        next();
      }, {prefix: '/api/user'});
      const cookie = await login('muhonglong', '112358');

      const res0 = await app.inject({
        method: 'GET',
        url: '/api/user/perm/system/config/mng',
        cookies: {Authorization: cookie.value}
      });
      expect(res0.statusCode).to.equal(200);
      expect(res0.body).to.equal('true');

      const res1 = await app.inject({
        method: 'GET',
        url: '/api/user/perm/config/mng',
        cookies: {Authorization: cookie.value}
      });
      expect(res1.statusCode).to.equal(200);
      expect(res1.body).to.equal('true');
    });
  });
});