
import {expect} from 'chai';
import {newModel, newEnforcer} from 'casbin';
import Sqlite from 'better-sqlite3';
import newAdapter from './adapter.js';

describe('为 casbin 定制 better-sqlite3 适配器', () => {
  it('鉴权', async () => {
    // 创建模型
    const m = newModel();
    m.addDef('r', 'r', 'sub, obj, act');
    m.addDef('p', 'p', 'sub, obj, act');
    m.addDef('g', 'g', '_, _');
    m.addDef('e', 'e', 'some(where (p.eft == allow))');
    m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

    // 权限数据适配器
    const db = new Sqlite(':memory:', {timeout: 60000});
    const a = await newAdapter(db);
    a.addPolicies('p', 'p', [
      ['alice', 'data1', 'read'],
      ['bob', 'data2', 'write'],
      ['data2_admin', 'data2', 'read'],
      ['data2_admin', 'data2', 'write'],
    ]);
    a.addPolicy('', 'g', ['alice', 'data2_admin']);
    
    // 实现 enforcer
    const e = await newEnforcer(m, a);

    // 使用 enforcer
    const ret = await e.enforce('bob', 'data2', 'write');
    expect(ret).to.be.true;
  });
});