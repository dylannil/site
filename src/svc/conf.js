/**
 * 配置服务
 * 
 * - 最近扫描所有帖子的时间点
 * - 最近修改案例清单的时间点
 * - 案例分类颜色
 * - 帖子标签颜色
 */
import Errs from '../err/index.js';

export default class {
  constructor(opts) {
    this.model = {
      'tag_color': 'tag, color',
      'scan_last': 'stamp, total, valid',
      'case_last': 'stamp',
      'case_type_color': 'type, color',
    };
    this.init(opts);
  }
  init(opts = {}) {
    if (!opts.dao) {throw new Error('服务 Auth 需要指定数据源');}
    if (opts.dao === this.dao) {return ;}

    this.dao = opts.dao;
  }
  getConfByType(type) {
    const item = this.dao.conf.getConfByType(type) || {};
    return this.model[type].split(',').reduce((ret, key, i) => {
      ret[key.trim()] = item[`v${i}`];
      return ret;
    }, {});
  }
  getConfAllByType(type) {
    const list = this.dao.conf.allConfByType(type) || [];
    return list.map(item => {
      return this.model[type].split(',').reduce((ret, key, i) => {
        ret[key.trim()] = item[`v${i}`];
        return ret;
      }, {});
    });
  }
  setConf(id, data, ...args) {
    if (typeof id !== 'number') {
      args.unshift(data);
      data = id;
      id = undefined;
    }
    const json = {};
    let len;
    if (typeof data === 'string') {
      json.type = data;
      len = args.length;
      for (let i = 0; i < 4; i++) {
        json[`v${i}`] = i < len ? args[i].toString() : null;
      }
    } else {
      json.type = data.type;
      (this.model[data.type] || '').split(',').forEach((key, _, arr) => {
        len = arr.length;
        for (let i = 0; i < 4; i++) {
          json[`v${i}`] = i < len ? data[key].toString() : null;
        }
      });
    }
    // 不指定 ID 新建，指定 ID 则更新
    if (!id) {
      const exist = this.dao.conf[`getConfByShort` + len](json);
      if (exist) {return ;}
      this.dao.conf.runInsertConfShort(json);
    } else {
      json.id = id;
      this.dao.conf.runUpdateConfShort(json);
    }
  }
  delConf(id) {
    id && this.dao.conf.runDeleteConf(id);
  }
  getAllTagColor() {return this.getConfAllByType('tag_color');}
  getAllCaseTypeColor() {return this.getConfAllByType('case_type_color');}
  getScanLastStamp() {
    const {stamp} = this.getConfByType('scan_last');
    return parseInt(stamp);
  }
  setScanLastStamp({total, valid} = {}, stamp = Math.round(Date.now() / 1000)) {
    const {id} = this.getConfByType('scan_last') || {};
    const json = {
      type: 'scan_last',
      stamp: stamp.toString(),
      total: total ? total.toString() : null,
      valid: valid ? valid.toString() : null
    };
    if (id) {
      this.setConf(id, json);
    } else {
      this.setConf(json);
    }
  }
  getCaseLastStamp() {
    const {stamp} = this.getConfByType('case_last');
    return parseInt(stamp);
  }
  setCaseLastStamp(stamp = Math.round(Date.now() / 1000)) {
    const {id} = this.getConfByType('case_last') || {};
    const json = {
      type: 'case_last',
      stamp: stamp.toString()
    };
    if (id) {
      this.setConf(id, json);
    } else {
      this.setConf(json);
    }
  }
}