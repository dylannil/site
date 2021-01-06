/**
 * 服务
 */
import dao, {init as daoInit} from '../data/index.js';

import User from './user.js';
import Auth from './auth.js';
// import Post from './post.js';
// import Date from './date.js';
import Case from './case.js';
// import Rank from './rank.js';
import Conf from './conf.js';
import Sys from './sys.js';

User.new = newSingleInst;
Auth.new = newSingleInst;
// Post.new = newSingleInst;
// Date.new = newSingleInst;
Case.new = newSingleInst;
// Rank.new = newSingleInst;
Conf.new = newSingleInst;
Sys.new = newSingleInst;

let inited;
export async function init(...args) {
  if (inited) {return ;}
  inited = true;

  return daoInit(...args); // 服务依赖的数据源层联动初始化
}

export default {User, Auth, Case, Conf, Sys};

function newSingleInst(opts = {}) {
  opts.dao = dao;
  if (this.inst) {
    this.inst.init(opts);
  } else {
    this.inst = new this(opts);
  }
  return this.inst;
}