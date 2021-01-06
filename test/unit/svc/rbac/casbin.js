const {newModel, Util} = require('casbin');
const Sqlite = require('better-sqlite3');

const newEnforcer = require('../../../src/rbac/enforcer');
const newAdapter = require('../../../src/rbac/adapter');
const casbin = require('../../../src/rbac/casbin');

module.exports = () => describe('casbin 接口测试', () => {
  describe('基本的操作 (RBAC 模式)', () => {
    let e;
  
    beforeEach(async () => {
      const db = new Sqlite(':memory:', {timeout: 60000});

      e = await casbin(db);

      const m = newModel();
      m.addDef('r', 'r', 'sub, obj, act');
      m.addDef('p', 'p', 'sub, obj, act');
      m.addDef('g', 'g', '_, _');
      m.addDef('e', 'e', 'some(where(p.eft == allow))');
      m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

      e.setModel(m);

      const a = newAdapter(db);
      a.addPolicies('', 'p', [
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write'],
      ]);
      a.addPolicy('', 'g', ['alice', 'data2_admin']);

      e.setAdapter(a);

      await e.loadPolicy(); // 将新的 adapter 的数据载入到 model 中
    });

    it('getAllSubjects', async () => {
      const allSubjects = await e.getAllSubjects();
      expect(allSubjects).to.eql(['alice', 'bob', 'data2_admin']);
    });
  
    it('getAllNamedSubjects', async () => {
      const allNamedSubjects = await e.getAllNamedSubjects('p');
      expect(allNamedSubjects).to.eql(['alice', 'bob', 'data2_admin']);
    });
  
    it('getAllObjects', async () => {
      const allObjects = await e.getAllObjects();
      expect(allObjects).to.eql(['data1', 'data2']);
    });
  
    it('getAllNamedObjects', async () => {
      let allNamedObjects = await e.getAllNamedObjects('p');
      expect(allNamedObjects).to.eql(['data1', 'data2']);
      allNamedObjects = await e.getAllNamedObjects('p1');
      expect(allNamedObjects).to.eql([]);
    });
  
    it('getAllActions', async () => {
      const allActions = await e.getAllActions();
      expect(allActions).to.eql(['read', 'write']);
    });
  
    it('getAllNamedActions', async () => {
      let allNamedActions = await e.getAllNamedActions('p');
      expect(allNamedActions).to.eql(['read', 'write']);
      allNamedActions = await e.getAllNamedActions('p1');
      expect(allNamedActions).to.eql([]);
    });
  
    it('getAllRoles', async () => {
      const allRoles = await e.getAllRoles();
      expect(allRoles).to.eql(['data2_admin']);
    });
  
    it('getAllNamedRoles', async () => {
      let allNamedRoles = await e.getAllNamedRoles('g');
      expect(allNamedRoles).to.eql(['data2_admin']);
      allNamedRoles = await e.getAllNamedRoles('g1');
      expect(allNamedRoles).to.eql([]);
    });
  
    it('getPolicy', async () => {
      const policy = await e.getPolicy();
      expect(policy).to.eql([
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
    });
  
    it('getFilteredPolicy', async () => {
      let filteredPolicy = await e.getFilteredPolicy(0, 'alice');
      expect(filteredPolicy).to.eql([['alice', 'data1', 'read']]);
      filteredPolicy = await e.getFilteredPolicy(0, 'bob');
      expect(filteredPolicy).to.eql([['bob', 'data2', 'write']]);
    });
  
    it('getNamedPolicy', async () => {
      let namedPolicy = await e.getNamedPolicy('p');
      expect(namedPolicy).to.eql([
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
      namedPolicy = await e.getNamedPolicy('p1');
      expect(namedPolicy).to.eql([]);
    });
  
    it('getFilteredNamedPolicy', async () => {
      const filteredNamedPolicy = await e.getFilteredNamedPolicy('p', 0, 'bob');
      expect(filteredNamedPolicy).to.eql([['bob', 'data2', 'write']]);
    });
  
    it('getGroupingPolicy', async () => {
      const groupingPolicy = await e.getGroupingPolicy();
      expect(groupingPolicy).to.eql([['alice', 'data2_admin']]);
    });
  
    it('getFilteredGroupingPolicy', async () => {
      const filteredGroupingPolicy = await e.getFilteredGroupingPolicy(0, 'alice');
      expect(filteredGroupingPolicy).to.eql([['alice', 'data2_admin']]);
    });
  
    it('getNamedGroupingPolicy', async () => {
      const namedGroupingPolicy = await e.getNamedGroupingPolicy('g');
      expect(namedGroupingPolicy).to.eql([['alice', 'data2_admin']]);
    });
  
    it('getFilteredNamedGroupingPolicy', async () => {
      const namedGroupingPolicy = await e.getFilteredNamedGroupingPolicy('g', 0, 'alice');
      expect(namedGroupingPolicy).to.eql([['alice', 'data2_admin']]);
    });
  
    it('hasPolicy', async () => {
      const hasPolicy = await e.hasPolicy('data2_admin', 'data2', 'read');
      expect(hasPolicy).to.be.true;
    });
  
    it('hasNamedPolicy', async () => {
      const hasNamedPolicy = await e.hasNamedPolicy('p', 'data2_admin', 'data2', 'read');
      expect(hasNamedPolicy).to.be.true;
    });
  
    it('addPolicy', async () => {
      const p = ['eve', 'data3', 'read'];
      const added = await e.addPolicy(...p);
      expect(added).to.be.true;
      expect(await e.hasPolicy(...p)).to.be.true;
    });
  
    it('addPolicies', async () => {
      const rules = [
        ['jack', 'data4', 'read'],
        ['katy', 'data4', 'write'],
        ['leyo', 'data4', 'read'],
        ['ham', 'data4', 'write']
      ];
      const added = await e.addPolicies(rules);
      expect(added).to.be.true;
      for (const rule of rules) {
        expect(await e.hasPolicy(...rule)).to.be.true;
      }
    });
  
    it('addNamedPolicy', async () => {
      const p = ['eve', 'data3', 'read'];
      const added = await e.addNamedPolicy('p', ...p);
      expect(added).to.be.true;
      expect(await e.hasPolicy(...p)).to.be.true;
    });
  
    it('addNamedPolicies', async () => {
      const rules = [
        ['jack', 'data4', 'read'],
        ['katy', 'data4', 'write'],
        ['leyo', 'data4', 'read'],
        ['ham', 'data4', 'write']
      ];
      const added = await e.addNamedPolicies('p', rules);
      expect(added).to.be.true;
      for (const rule of rules) {
        expect(await e.hasPolicy(...rule)).to.be.true;
      }
    });
  
    it('removePolicy', async () => {
      const p = ['alice', 'data1', 'read'];
      const removed = await e.removePolicy(...p);
      expect(removed).to.be.true;
      expect(await e.hasPolicy(...p)).to.be.false;
    });
  
    it('removePolicies', async () => {
      const rules = [
        ['jack', 'data4', 'read'],
        ['katy', 'data4', 'write'],
        ['leyo', 'data4', 'read'],
        ['ham', 'data4', 'write']
      ];
      const added = await e.addPolicies(rules);
      expect(added).to.be.true;
      const removed = await e.removePolicies(rules);
      expect(removed).to.be.true;
      for (const rule of rules) {
        expect(await e.hasPolicy(...rule)).to.be.false;
      }
    });
  
    it('removeFilteredPolicy', async () => {
      const p = ['alice', 'data1', 'read'];
      const removed = await e.removeFilteredPolicy(0, ...p);
      expect(removed).to.be.true;
      expect(await e.hasPolicy(...p)).to.be.false;
    });
  
    it('removeNamedPolicy', async () => {
      const p = ['alice', 'data1', 'read'];
      const removed = await e.removeNamedPolicy('p', ...p);
      expect(removed).to.be.true;
      expect(await e.hasPolicy(...p)).to.be.false;
    });
  
    it('removeNamedPolicies', async () => {
      const rules = [
        ['jack', 'data4', 'read'],
        ['katy', 'data4', 'write'],
        ['leyo', 'data4', 'read'],
        ['ham', 'data4', 'write']
      ];
      const added = await e.addPolicies(rules);
      expect(added).to.be.true;
      const removed = await e.removeNamedPolicies('p', rules);
      expect(removed).to.be.true;
      for (const rule of rules) {
        expect(await e.hasPolicy(...rule)).to.be.false;
      }
    });
  
    it('removeFilteredNamedPolicy', async () => {
      const p = ['alice', 'data1', 'read'];
      const removed = await e.removeFilteredNamedPolicy('p', 0, ...p);
      expect(removed).to.be.true;
      expect(await e.hasPolicy(...p)).to.be.false;
    });
  
    it('hasGroupingPolicy', async () => {
      const has = await e.hasGroupingPolicy('alice', 'data2_admin');
      expect(has).to.be.true;
    });
  
    it('hasNamedGroupingPolicy', async () => {
      const has = await e.hasNamedGroupingPolicy('g', 'alice', 'data2_admin');
      expect(has).to.be.true;
    });
  
    it('addGroupingPolicy', async () => {
      const added = await e.addGroupingPolicy('group1', 'data2_admin');
      expect(added).to.be.true;
    });
  
    it('addGroupingPolicies', async () => {
      const groupingRules = [
        ['ham', 'data4_admin'],
        ['jack', 'data5_admin']
      ];
      const added = await e.addGroupingPolicies(groupingRules);
      expect(added).to.be.true;
    });
  
    it('addNamedGroupingPolicy', async () => {
      const added = await e.addNamedGroupingPolicy('g', 'group1', 'data2_admin');
      expect(added).to.be.true;
    });
  
    it('addNamedGroupingPolicies', async () => {
      const groupingRules = [
        ['ham', 'data4_admin'],
        ['jack', 'data5_admin']
      ];
      const added = await e.addNamedGroupingPolicies('g', groupingRules);
      expect(added).to.be.true;
    });
  
    it('removeGroupingPolicy', async () => {
      const removed = await e.removeGroupingPolicy('alice', 'data2_admin');
      expect(removed).to.be.true;
    });
  
    it('removeGroupingPolicies', async () => {
      const groupingRules = [
        ['ham', 'data4_admin'],
        ['jack', 'data5_admin']
      ];
      const added = await e.addGroupingPolicies(groupingRules);
      expect(added).to.be.true;
      const removed = await e.removeGroupingPolicies(groupingRules);
      expect(removed).to.be.true;
    });
  
    it('removeFilteredGroupingPolicy', async () => {
      const removed = await e.removeFilteredGroupingPolicy(0, 'alice');
      expect(removed).to.be.true;
    });
  
    it('removeFilteredNamedGroupingPolicy', async () => {
      const removed = await e.removeFilteredNamedGroupingPolicy('g', 0, 'alice');
      expect(removed).to.be.true;
    });
  
    it('removeNamedGroupingPolicies', async () => {
      const groupingRules = [
        ['ham', 'data4_admin'],
        ['jack', 'data5_admin']
      ];
      const added = await e.addGroupingPolicies(groupingRules);
      expect(added).to.be.true;
      const removed = await e.removeNamedGroupingPolicies('g', groupingRules);
      expect(removed).to.be.true;
    });
  });

  describe('RBAC操作', () => {
    let e;

    beforeEach(async () => {
      const db = new Sqlite(':memory:', {timeout: 60000});
      
      e = await casbin(db);

      const m = newModel();
      m.addDef('r', 'r', 'sub, obj, act');
      m.addDef('p', 'p', 'sub, obj, act');
      m.addDef('g', 'g', '_, _');
      m.addDef('e', 'e', 'some(where (p.eft == allow))');
      m.addDef('m', 'm', 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act');

      e.setModel(m);

      const a = newAdapter(db);
      a.addPolicies('', 'p', [
        ['alice', 'data1', 'read'],
        ['bob', 'data2', 'write'],
        ['data1_admin', 'data1', 'read'],
        ['data1_admin', 'data1', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
      a.addPolicies('', 'g', [
        ['alice', 'admin'],
        ['admin', 'data1_admin'],
        ['admin', 'data2_admin']
      ]);

      e.setAdapter(a);

      await e.loadPolicy(); // 将新的 adapter 的数据载入到 model 中
    });

    it('接口 getRolesForUser', async () => {
      expect(await e.getRolesForUser('alice')).to.eql(['admin']);
    });

    it('接口 add/deleteRoleForUSer', async () => {
      expect(await e.getRolesForUser('bob')).to.eql([]);
      expect(await e.addRoleForUser('bob', 'data1_admin')).to.eql(true);
      expect(await e.hasRoleForUser('bob', 'data1_admin')).to.eql(true);
      expect(await e.getUsersForRole('data1_admin')).to.eql(['admin', 'bob']);
      expect(await e.deleteRoleForUser('bob', 'data1_admin')).to.eql(true);
      expect(await e.hasRoleForUser('bob', 'role:global_admin')).to.eql(false);
      expect(await e.getUsersForRole('data1_admin')).to.eql(['admin']);
    });

    it('接口 getImplicitRolesForUser', async () => {
      expect(await e.getImplicitRolesForUser('bob')).to.eql([]);
      expect(await e.getImplicitRolesForUser('alice')).to.eql(['admin', 'data1_admin', 'data2_admin']);
    });
  
    it('接口 getImplicitPermissionsForUser', async () => {
      // const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
      expect(await e.hasPermissionForUser('bob', 'data2', 'write')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([['bob', 'data2', 'write']]);
      expect(await e.hasPermissionForUser('alice', 'data1', 'read')).to.eql(true);
      expect(await e.hasPermissionForUser('data1_admin', 'data1', 'read')).to.eql(true);
      expect(await e.hasPermissionForUser('data1_admin', 'data1', 'write')).to.eql(true);
      expect(await e.hasPermissionForUser('data2_admin', 'data2', 'read')).to.eql(true);
      expect(await e.hasPermissionForUser('data2_admin', 'data2', 'write')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([
        ['alice', 'data1', 'read'],
        ['data1_admin', 'data1', 'read'],
        ['data1_admin', 'data1', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
    });
  
    it('接口 deleteRolesForUser', async () => {
      // const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
      expect(await e.hasPermissionForUser('bob', 'data2', 'write')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([['bob', 'data2', 'write']]);
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([
        ['alice', 'data1', 'read'],
        ['data1_admin', 'data1', 'read'],
        ['data1_admin', 'data1', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
      expect(await e.deleteRolesForUser('alice')).to.eql(true);
      expect(await e.hasPermissionForUser('alice', 'data1', 'read')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([['alice', 'data1', 'read']]);
      expect(await e.hasPermissionForUser('bob', 'data2', 'write')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([['bob', 'data2', 'write']]);
      expect(await e.deleteRolesForUser('bob')).to.eql(false);
      expect(await e.hasPermissionForUser('alice', 'data1', 'read')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([['alice', 'data1', 'read']]);
      expect(await e.hasPermissionForUser('bob', 'data2', 'write')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([['bob', 'data2', 'write']]);
    });

    it('接口 deleteRole', async () => {
      // const e = await newEnforcer('examples/rbac_model.conf', 'examples/rbac_with_hierarchy_policy.csv');
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([['bob', 'data2', 'write']]);
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([
        ['alice', 'data1', 'read'],
        ['data1_admin', 'data1', 'read'],
        ['data1_admin', 'data1', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
      expect(await e.deleteRole('data1_admin')).to.eql(true);
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([
        ['alice', 'data1', 'read'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
      await e.deleteRole('data2_admin');
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([['alice', 'data1', 'read']]);
    });

    it('接口 deleteUser', async () => {
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([['bob', 'data2', 'write']]);
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([
        ['alice', 'data1', 'read'],
        ['data1_admin', 'data1', 'read'],
        ['data1_admin', 'data1', 'write'],
        ['data2_admin', 'data2', 'read'],
        ['data2_admin', 'data2', 'write']
      ]);
      await e.deleteUser('alice');
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([]);
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([['bob', 'data2', 'write']]);
      await e.deleteRole('bob');
      expect(await e.getImplicitPermissionsForUser('alice')).to.eql([]);
      expect(await e.getImplicitPermissionsForUser('bob')).to.eql([]);
    });

    it('接口 getImplicitUsersForPermission', async () => {
      expect(await e.getImplicitUsersForPermission('data1', 'read')).to.eql(['alice']);
      expect(await e.getImplicitUsersForPermission('data1', 'write')).to.eql(['alice']);
      expect(await e.getImplicitUsersForPermission('data2', 'read')).to.eql(['alice']);
      expect(await e.getImplicitUsersForPermission('data2', 'write')).to.eql(['alice', 'bob']);

      e.clearPolicy();

      await e.addPolicy('admin', 'data1', 'read');
      await e.addPolicy('bob', 'data1', 'read');
      await e.addGroupingPolicy('alice', 'admin');

      const ret = e.adapter.client.prepare('SELECT * FROM casbin').all();

      expect(await e.getImplicitUsersForPermission('data1', 'read')).to.eql(['bob', 'alice']);
    });
  });

  describe('RBAC操作 (域内)', () => {
    let e;

    beforeEach(async () => {
      const db = new Sqlite(':memory:', {timeout: 60000});
      
      e = await casbin(db);

      const m = newModel();
      m.addDef('r', 'r', 'sub, dom, obj, act');
      m.addDef('p', 'p', 'sub, dom, obj, act');
      m.addDef('g', 'g', '_, _, _');
      m.addDef('e', 'e', 'some(where(p.eft == allow))');
      m.addDef('m', 'm', 'g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act');

      e.setModel(m);

      const a = newAdapter(e.adapter.client);
      a.addPolicies('', 'p', [
        ['role:reader', 'domain1', 'data1', 'read'],
        ['role:writer', 'domain1', 'data1', 'write'],
      ]);
      a.addPolicies('', 'g', [
        ['role:global_admin', 'role:reader', 'domain1'],
        ['role:global_admin', 'role:writer', 'domain1'],
        ['alice', 'role:global_admin', 'domain1'],
      ]);

      e.setAdapter(a);

      await e.loadPolicy(); // 将新的 adapter 的数据载入到 model 中
    });

    it('接口 getRolesForUser', async () => {
      expect(await e.getRolesForUser('alice', 'domain1')).to.eql(['role:global_admin']);
    });

    it('接口 add/deleteRoleForUSer', async () => {
      expect(await e.getRolesForUser('bob', 'domain1')).to.eql([]);
      expect(await e.addRoleForUser('bob', 'role:global_admin', 'domain1')).to.eql(true);
      expect(await e.hasRoleForUser('bob', 'role:global_admin', 'domain1')).to.eql(true);
      expect(await e.getUsersForRole('role:global_admin', 'domain1')).to.eql(['alice', 'bob']);
      expect(await e.deleteRoleForUser('bob', 'role:global_admin', 'domain1')).to.eql(true);
      expect(await e.hasRoleForUser('bob', 'role:global_admin', 'domain1')).to.eql(false);
      expect(await e.getUsersForRole('role:global_admin', 'domain1')).to.eql(['alice']);
    });
  
    it('接口 getImplicitRolesForUser', async () => {
      expect(await e.getImplicitRolesForUser('alice', 'domain1')).to.eql(['role:global_admin', 'role:reader', 'role:writer']);
    });
  
    it('接口 deleteRolesForUser', async () => {
      const a = newAdapter(e.adapter.client);
      a.removePolicies('', 'p', [
        ['role:reader', 'domain1', 'data1', 'read'],
        ['role:writer', 'domain1', 'data1', 'write'],
      ]);
      a.removePolicies('', 'g', [
        ['role:global_admin', 'role:reader', 'domain1'],
        ['role:global_admin', 'role:writer', 'domain1'],
        ['alice', 'role:global_admin', 'domain1'],
      ]);
      a.addPolicies('', 'p', [
        ['admin', 'domain1', 'data1', 'read'],
        ['admin', 'domain1', 'data1', 'write'],
        ['admin', 'domain2', 'data2', 'read'],
        ['admin', 'domain2', 'data2', 'write']
      ]);
      a.addPolicies('', 'g', [
        ['alice', 'admin', 'domain1'],
        ['bob', 'admin', 'domain2']
      ]);
  
      e.setAdapter(a);
  
      await e.loadPolicy();
  
      expect(await e.getImplicitRolesForUser('alice', 'domain1')).to.eql(['admin']);
      expect(await e.getImplicitPermissionsForUser('alice', 'domain1')).to.eql([
        ['admin', 'domain1', 'data1', 'read'],
        ['admin', 'domain1', 'data1', 'write']
      ]);
      expect(await e.getImplicitPermissionsForUser('bob', 'domain2')).to.eql([
        ['admin', 'domain2', 'data2', 'read'],
        ['admin', 'domain2', 'data2', 'write']
      ]);
      expect(await e.deleteRolesForUser('alice', 'domain1')).to.eql(true);
      expect(await e.getImplicitRolesForUser('alice', 'domain1')).to.eql([]);
      expect(await e.getImplicitPermissionsForUser('alice', 'domain2')).to.eql([]);
      expect(await e.getImplicitPermissionsForUser('bob', 'domain2')).to.eql([
        ['admin', 'domain2', 'data2', 'read'],
        ['admin', 'domain2', 'data2', 'write']
      ]);
      expect(await e.deleteRolesForUser('bob', 'domain1')).to.eql(false);
      expect(await e.getImplicitPermissionsForUser('alice', 'domain2')).to.eql([]);
      expect(await e.getImplicitPermissionsForUser('bob', 'domain1')).to.eql([]);
    });
  });
});