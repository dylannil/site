
const {newModel, StringAdapter} = require('casbin');
const factory = require('../../../src/rbac/enforcer');

module.exports = () => describe('定制带缓存 Enforcer', () => {
  it('简单的 RBAC 模式，使用 LRU 缓存被清理', async () => {
    const m = newModel();
    m.addDef('r', 'r', 'sub, obj, act');
    m.addDef('p', 'p', 'sub, obj, act');
    m.addDef('g', 'g', '_, _');
    m.addDef('e', 'e', 'some(where (p.eft == allow))');
    m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

    const a = new StringAdapter([
      'p, alice, data1, read',
      'p, bob, data2, write',
      'p, data2_admin, data2, read',
      'p, data2_admin, data2, write',
      'g, alice, data2_admin'
    ].join('\n'));

    const e = await factory(m, a, 1);

    // 允许 alice 对 data1 进行 read 操作
    const ret = await e.enforce('alice', 'data1', 'read');
    expect(ret).to.be.true;

    const key = e.getCacheKey('alice', 'data1', 'read');
    expect(e.getCache(key)).to.be.true;


    const ret1 = await e.enforce('data2_admin', 'data2', 'write');
    expect(ret).to.be.true;

    const key1 = e.getCacheKey('data2_admin', 'data2', 'write');
    expect(e.getCache(key1)).to.be.true;

    // 缓存已经被清理
    expect(e.getCache(key)).to.be.undefined;
  });
});