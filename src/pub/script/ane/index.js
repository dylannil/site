/**
 * 微型前端框架，支持 SSR 和 SPA
 * 
 * - router 扩展组件能力，匹配当前路径
 * - 
 */
import * as AneDOM from "./dom.js";
import {useRef, useEffect, useContext, createContext} from './hook.js';
import {useSession} from './session.js';
import {route, useLink, navTo} from './router.js';
import {useForm} from './form.js';
import {ajax, upload} from './ajax.js';

export {AneDOM};

export class Component {
  constructor(props) {
    this.props = props || {};
  }
  useRef() {
    return useRef(this);
  }
  bindRef(key, dom) {
    this._refs || (this._refs = {});
    this._refs[key] = dom;
  }
  ref(key) {
    return (this._refs || {})[key];
  }
  // 使用 key 标示一个 effect
  useEffect(create, deps, key) {
    if (Object.prototype.toString.call(deps) === '[object String]') {
      key = deps;
      deps = undefined;
    }
    // 初始化
    this._efcs || (this._efcs = []);
    // 排重，deps 完全没有变化时，不做重新运行
    for (let i = 0, len = this._efcs.length; i < len; i++) {
      const efc = this._efcs[i];
      if (efc.key === key) {
        let flag = true;
        if (deps && deps.length === efc.deps.length) {
          flag = false;
          for (let j = 0, len = deps.length; j < len; j++) {
            if (deps[j] !== efc.deps[j]) {
              flag = true;
              break;
            }
          }
        }
        if (flag === true) {
          useEffect(this);
          efc.create = create; // 需要更新，则替换成新的 create 方法
          efc.deps = [...deps]; // 克隆一份，而不是直接引用
          efc.toplay = true;
        }
        return ;
      }
    }
    // 新建
    useEffect(this);
    this._efcs.push({create, deps, key, toplay: true});
  }
  playEffect() {
    const efcs = this._efcs || [];
    for (let i = 0, len = efcs.length; i < len; i++) {
      const efc = efcs[i];
      if (efc.toplay) {
        efc.dispose && efc.dispose(); // 销毁旧的
        efc.dispose = efc.create(); // 创建新的
        delete efc.toplay;
      }
    }
  }
  cleanEffect() {
    const efcs = this._efcs || [];
    let i = efcs.length;
    while (i--) {
      const efc = efcs[i];
      efc.dispose && efc.dispose(); // 销毁旧的
      efcs.splice(i, 1);
    }
  }
  // 
  createContext(descriptor, initial) {
    createContext(descriptor, initial);
  }
  useContext(descriptor) {
    useContext(descriptor);
  }
  // 
  dispose() {
    this.cleanEffect();
  }
  // 
  nativeRender() {
    // todo 跳转 render 输出，以支持渲染出的 DOM 子树绑定到当前实例
    // 
    // todo 已经存在的 DOM 子树，直接复用
  }
  render() {
    return `<p>Hello Ane!</p>`;
  }
  get [Symbol.toStringTag]() {
    return 'AneComponent';
  }
};

Object.assign(Component.prototype, {
  route, useLink, navTo,
  ajax, upload,
  useForm,
  useSession
});

export default {
  Component
};