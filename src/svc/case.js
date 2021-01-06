
/**
 * 案例服务
 */
export default class {
  constructor(opts) {
    this.init(opts);
  }
  init(opts = {}) {
    if (!opts.dao) {throw new Error('服务 case 需要指定数据源');}
    if (opts.dao === this.dao) {return ;}

    this.dao = opts.dao;
    this.svc = opts.svc;
  }
  getDateActive() {
    const {case: dao} = this.dao;
    const list = dao.allDateActive();
    return list;
  }
  // 创建或更新一个案例，需要传入完整数据，库内数据会被完全替换
  async setCase(data = {}) {
    if (!data.name) {throw new Errs.SE_CASE_NEED_ID_OR_NAME();}
    const {case: dao} = this.dao;

    const json = {
      name: null,
      type: null,
      desc: null,
      word: null,
      link: null,
      img: null
    };

    for (let name in data) {
      json[name] = data[name];
    }

    let id = data.id;
    id || ({id} = dao.getCaseByName(json.name) || {});

    if (id) {
      json.id = id;
      dao.runUpdateCaseShort(json);
    } else {
      dao.runInsertCaseShort(json);
    }

    this.svc.conf.setCaseLastStamp();

    return dao.getCaseByName(json.name);
  }
  // 
  async delCase(id) {
    if (!id) {return ;}
    const {case: dao} = this.dao;

    const exist = dao.getCase(id);
    if (!exist) {return ;}

    dao.runDeleteCase(id);
  }
  // 切换案例可否公开状态
  async toggleCaseAble(id) {
    if (!id) {return ;}
    const {case: dao} = this.dao;

    const exist = dao.getCase(id);
    if (!exist) {return ;}

    const able = exist.able === 1 ? 0 : 1;
    dao.runUpdateCaseAble({id, able});
    return able;
  }
  // 提取所有的案例清单
  // 如果是管理员请求，则不使用缓存数据
  async getAllCases(stamp, admin) {
    if (!admin && stamp && stamp >= this.svc.conf.getCaseLastStamp()) {
      return -1; // 客户端的 stamp 是最新的，不需要重新加载
    }
    // 
    const {case: dao} = this.dao;
    const list = [];
    for (let item of dao.iterateCase()) {
      if (admin || item.able) {
        list.push(item);
      }
    }
    return list;
  }
}