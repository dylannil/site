/**
 * 用户数据
 */
import sqlite from 'better-sqlite3';
import date from '../../../src/data/schema/date.js';

export default () => describe('日程数据', () => {
  describe('表的创建', () => {
    [
      ['date', 'Date']
    ].forEach(([name, suff]) => {
      it(`创建并核对表 ${name}`, () => {
        const db = sqlite(':memory:', {});
        
        const ret0 = db.prepare(date[`sqlExistsTable${suff}`]()).get();
        expect(ret0).to.be.undefined;
        
        db.exec(date[`sqlCreateTable${suff}`]());

        const ret = db.prepare(date[`sqlExistsTable${suff}`]()).get();
        expect(ret.name).to.equal(name);
        expect(ret.type).to.equal('table');
      });
    });
  });
  describe('增删改查', () => {
    let db;
    beforeEach(() => {
      db = sqlite(':memory:', {});
      db.exec(date.sqlCreateTableDate());
    });
    // it(`获取一条信息`, () => {
    //   const ret = db.prepare(date.getUserByUserName()).get('root');
    //   expect(ret).to.be.undefined;
    // });
    it(`插入一条信息`, () => {
      db.prepare(date.runInsertDateShort()).run({
        name: 'dummy',
        desc: 'dummy dummy',
        start: Math.round(Date.now() / 1000) - 60,
        end: Math.round(Date.now() / 1000) + 60,
      });
      const ret = db.prepare(date.allDate()).all();
      expect(ret).to.be.lengthOf(1);

      const ret1 = db.prepare(date.allDateActive()).all();
      expect(ret1).to.be.lengthOf(1);
    });
  });
});
