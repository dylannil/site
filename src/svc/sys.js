/**
 * 系统服务
 */
export default class {
  constructor(opts) {
    this.init(opts);
  }
  init(opts = {}) {
    if (!opts.dao) {throw new Error('服务 date 需要指定数据源');}
    if (opts.dao === this.dao) {return ;}

    this.dao = opts.dao;
  }
  async getPubHash() {
    if (!/(\\|\/)dist(\\|\/)/.test(__filename)) {return null;}
    const file = './pub.json';
    try {
      return await import(file);
    } catch {
      return null;
    }
  }
}