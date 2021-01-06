/**
 * 数据
 * 
 * - 数据库的初始化和连接
 * - 数据库查询脚本生成
 */
import sqlite from './sqlite.js';
import schema from './schema/index.js';

const runner = [
  ['get', 'sqlExistsTable', (st, args) => st.get(...args)],
  ['all', (st, args) => st.all(...args)],
  ['run', (st, args) => st.run(...args)],
  ['iterate', (st, args) => st.iterate(...args)],
  ['pluck', (st, args) => st.pluck(...args)],
  ['expand', (st, args) => st.expand(...args)],
  ['raw', (st, args) => st.raw(...args)],
  ['columns', (st, args) => st.columns(...args)],
  ['bind', (st, args) => st.bind(...args)],
];

const stMap = {}; // 缓存 prepare 好的 stat
let db;

let inited;
export async function init(opts, root) {
  if (inited) {return ;}
  inited = true;

  db = sqlite(opts);

  const {user, auth, case: esac, conf} = dao;

  if (!user.sqlExistsTableUser()) {
    user.sqlCreateTableUser();
    root && user.runInsertUserRoot(await root());
  } else if (!user.getUserRoot()) {
    root && user.runInsertUserRoot(await root());
  }
  if (!user.sqlExistsTableUserInviteCode()) {
    user.sqlCreateTableUserInviteCode();
  }
  if (!user.sqlExistsTableUserPassReset()) {
    user.sqlCreateTableUserPassReset();
  }
  if (!user.sqlExistsTableUserMailVerify()) {
    user.sqlCreateTableUserMailVerify();
  }
  if (!user.sqlExistsTableUserBlackList()) {
    user.sqlCreateTableUserBlackList();
  }

  if (!auth.sqlExistsTableAuth()) {
    auth.sqlCreateTableAuth();
    auth.runInsertAuthRoot();
  } else if (!auth.getAuthRoot()) {
    auth.runInsertAuthRoot();
  }
  
  if (!esac.sqlExistsTableCase()) {
    esac.sqlCreateTableCase();
  }

  if (!conf.sqlExistsTableConf()) {
    conf.sqlCreateTableConf();
  }
};

const dao = {
  // knex,
  user: {...wrap('user', schema.user)},
  auth: {...wrap('auth', schema.auth)},
  case: {...wrap('case', schema.case)},
  conf: {...wrap('conf', schema.conf)},
  // 
  trx: cb => db.transaction(cb)
}
export default dao;

function wrap(schema, sqls) {
  const map = stMap[schema] || {};
  const alt = {};
  const ret = {};
  for (let key in sqls) {
    // 提取运行方式
    let run = runner.find(it => {
      for (let i = 0, len = it.length - 1; i < len; i++) {
        if (key.startsWith(it[i])) {
          return true;
        }
      }
      return false;
    });
    if (!run) {
      run = [undefined, it => db.exec(it.source)];
    }
    // 封装接口函数
    ret[key] = (function(runner, ...args) {
      let st = map[key];
      if (!st) {
        const sql = sqls[key]();
        try {
          st = db.prepare(sql);
        } catch (e) {
          if (e.message.includes('more than one statement')) {
            st = {source: sql};
          } else {
            throw e;
          }
        }
      }
      alt[key] = st;
      // 执行
      return runner(st, args);
    }).bind(null, run[run.length - 1]);
  }
  stMap[schema] = alt;
  return ret;
}
