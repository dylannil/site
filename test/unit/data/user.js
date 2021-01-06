/**
 * 用户数据
 */
import sqlite from 'better-sqlite3';
import user from '../../../src/data/schema/user.js';

export default () => describe('用户数据', () => {
  describe('表的创建', () => {
    [
      ['user', 'User'],
      ['user_invite_code', 'UserInviteCode'],
      ['user_pass_reset', 'UserPassReset'],
      ['user_mail_verify', 'UserMailVerify'],
      ['user_casbin', 'UserCasbin']
    ].forEach(([name, suff]) => {
      it(`创建并核对表 ${name}`, () => {
        const db = sqlite(':memory:', {});
        
        const ret0 = db.prepare(user[`sqlExistsTable${suff}`]()).get();
        expect(ret0).to.be.undefined;
        
        db.exec(user[`sqlCreateTable${suff}`]());

        const ret = db.prepare(user[`sqlExistsTable${suff}`]()).get();
        expect(ret.name).to.equal(name);
        expect(ret.type).to.equal('table');
      });
    });
  });
  describe('增删改查', () => {
    let db;
    beforeEach(() => {
      db = sqlite(':memory:', {});
      db.exec(user.sqlCreateTableUser());
    });
    it(`获取一条信息`, () => {
      const ret = db.prepare(user.getUserByUserName()).get('root');
      expect(ret).to.be.undefined;
    });
    it(`插入一条信息`, () => {
      db.exec(user.sqlCreateTableUserInviteCode());
      db.prepare(user.runInsertUserInviteCode()).run({
        id: 10000,
        code: '123456',
        createdAt: Math.round(Date.now() / 1000)
      });
      const ret = db.prepare(user.allUserInviteCode()).all();
      expect(ret).to.be.lengthOf(1);
    });
  });
});
