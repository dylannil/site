/**
 * 权限服务
 */

import {newModel, Enforcer, Helper} from 'casbin';
import Errs from '../err/index.js';

export default class {
  constructor(opts) {
    this.enforcer = this.casbin();
    this.init(opts);
  }
  init(opts = {}) {
    if (!opts.dao) {throw new Error('服务 Auth 需要指定数据源');}
    if (opts.dao === this.dao) {return ;}

    this.dao = opts.dao;

    // 每次调整 dao 需要重载 enforcer 内的规则
    // 之前未结束的重载过程，忽略
    this.ready = this.enforcer.init().then(() => {
      this.ready = undefined;
    });
  }
  casbin() {
    const m = newModel();
    m.addDef('r', 'r', 'sub, dom, obj, act');
    m.addDef('p', 'p', 'sub, dom, obj, act');
    m.addDef('g', 'g', '_, _, _');
    m.addDef('g', 'g2', '_, _');
    m.addDef('e', 'e', 'some(where (p.eft == allow))');
    m.addDef('m', 'm', 'g(r.sub, p.sub, r.dom) && r.dom == p.dom && r.obj == p.obj && r.act == p.act || r.dom == "mass" || g2(r.sub, "root")');

    const a = {
      loadPolicy(model) {
        const policies = this.dao.allAuth();
        for (const line of policies) {
          this.loadPolicyLine(line, model);
        }
      },
      loadPolicyLine(line, model) {
        const {ptype, v0, v1, v2, v3} = line;
        const str = [ptype, v0, v1, v2, v3].filter(Boolean).join(', ');
        Helper.loadPolicyLine(str, model);
      },
      savePolicy(model) {
        // 
      },
      savePolicy(ptype, rule) {
        if (!rule || rule.length < 2) {
          throw new Errs.SE_AUTH_INVALID_RULE();
        }
        const [v0, v1, v2 = null, v3 = null] = rule;
        return {ptype, v0, v1, v2, v3}
      },
      addPolicy(sec, ptype, rule) {
        const line = this.savePolicyLine(ptype, rule);

        if (!this.dao.getAuthByData(line)) {
          this.dao.runInsertAuthShort(line);
        }
      },
      addPolicies(sec, ptype, rules) {
        for (const rule of rules) {
          this.addPolicy(sec, ptype, rule);
        }
      },
      removePolicy(sec, ptype, rule) {
        const line = this.savePolicyLine(ptype, rule);

        const item = this.dao.getAuthByData(line);
        if (item) {
          this.dao.runDeleteAuth(item.id);
        }
      },
      removePolicies(sec, ptype, rules) {
        for (const rule of rules) {
          this.removePolicy(sec, ptype, rule);
        }
      },
      clearPolicy() {
        this.dao.runClearAuth();
      },
      removeFilteredPolicy(sec, ptype, fieldIndex, ...fieldValues) {
        const line = { ptype };
        const idx = fieldIndex + fieldValues.length;
        for (let i = 0; i < 4; i++) {
          if (fieldIndex <= i && i < idx) {
            line['v' + i] = fieldValues[i - fieldIndex];
          } else {
            line['v' + i] = null;
          }
        }

        const item = this.dao.getAuthByData(line);
        item && this.dao.runDeleteAuth(item.id);
      },
      close() {}
    };
    Object.defineProperty(a, 'dao', {
      get: () => this.dao.auth
    });

    const e = new Enforcer();
    e.adapter = a;
    e.model = m;

    // 每次调用，清理之前加载的所有 Policy 然后从 Adapter 中全部加载所有
    e.init = () => e.loadPolicy(m, a);

    return e;
  }
  async enforce(sub, dom, obj, act) {
    return this.enforcer.enforce(sub, dom, obj, act);
  }
}