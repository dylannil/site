/**
 * 钩子
 */

/**
 * useState 状态
 * 
 * TODO useState 触发局部重新渲染
 */





/**
 * useEffect 效果
 * 
 * 在模板组装过程中，在全局注册钩子
 * 在实际渲染结束后，将所有全局的钩子运行一遍，然后清理掉所有全局钩子
 */
let j = 0;
let effects = {};
export function useEffect(inst) {
  for (let k in effects) {
    if (effects[k] === inst) {
      return k;
    }
  }
  effects[j] = inst;
  return j++;
}
export function playEffect() {
  for (let k in effects) {
    effects[k].playEffect();
    delete effects[k];
  }
  j = 0;
  effects = {};
}




/**
 * useContext 上下文
 * 
 * 在模块组装过程中，在全局注册钩子
 * 实际渲染过程中，分别创建上下文和引用上下文
 */
const contexts = {};
export function createContext(descriptor, initial = {}) {
  contexts[descriptor] = initial;
}
export function useContext(descriptor) {
  return contexts[descriptor];
}




/**
 * useRef 引用
 * 
 * 模板组装过程中，在全局注册钩子
 * 在实际渲染过程中，将渲染得到的实际 DOM 通过钩子绑定到对应组件实例中
 * 一个 DOM 绑定成功后，移除其对应的钩子，后续重用则重注册钩子
 * 整个页面注册成功后，清理剩余的没有使用过的钩子
 */
let i = 0;
let refs = {};
export function useRef(inst) {
  refs[i] = inst;
  return i++;
}
export function bindRef(key, dom) {
  const inst = refs[key];
  if (inst) {
    inst.bindRef(key, dom);
    delete refs[key];
  } else {
    console.warn(`请检查您是否注册了对应的 Ref 钩子 ${key}`);
  }
}
export function cleanRef() {
  const refs = Object.keys(refs);
  if (refs.length) {
    console.warn(`存在 ${refs.length} 个钩子未被使用`);
  }
  i = 0;
  refs = {};
}
