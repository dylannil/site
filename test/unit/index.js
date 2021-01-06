/**
 * 单元测试集
 * 
 * - cmd 模块
 * - web 模块
 * - user 模块
 * - post 模块
 * - date 模块
 */
import cmd from './cmd/index.js';
import web from './web/index.js';
import pub from './pub/index.js';
import svc from './svc/index.js';
import data from './data/index.js';
// import user from './user/index.js';
// import post from './post/index.js';
// import date from './date/index.js';

describe('单元测试', () => {
  cmd();
  web();
  pub();
  svc();
  data();
  // user()
  // post();
  // date();
});