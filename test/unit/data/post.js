/**
 * 帖子数据
 */
import sqlite from 'better-sqlite3';
import post from '../../../src/data/schema/post.js';

export default () => describe('帖子数据', () => {
  describe('表的创建', () => {
    [
      ['post', 'Post']
    ].forEach(([name, suff]) => {
      it(`创建并核对表 ${name}`, () => {
        const db = sqlite(':memory:', {});
        
        const ret0 = db.prepare(post[`sqlExistsTable${suff}`]()).get();
        expect(ret0).to.be.undefined;
        
        db.exec(post[`sqlCreateTable${suff}`]());

        const ret = db.prepare(post[`sqlExistsTable${suff}`]()).get();
        expect(ret.name).to.equal(name);
        expect(ret.type).to.equal('table');
      });
    });
  });
  describe('增删改查', () => {
    let db;
    beforeEach(() => {
      db = sqlite(':memory:', {});
      db.exec(post.sqlCreateTablePost());
    });
    // it(`获取一条信息`, () => {
    //   const ret = db.prepare(date.getUserByUserName()).get('root');
    //   expect(ret).to.be.undefined;
    // });
    it(`插入一条信息`, () => {
      // db.prepare(post.runInsertDateShort()).run({
      //   name: 'dummy',
      //   desc: 'dummy dummy',
      //   start: Math.round(Date.now() / 1000) - 60,
      //   end: Math.round(Date.now() / 1000) + 60,
      // });
      // const ret = db.prepare(post.allDate()).all();
      // expect(ret).to.be.lengthOf(1);

      // const ret1 = db.prepare(post.allDateActive()).all();
      // expect(ret1).to.be.lengthOf(1);
    });
  });
});
