import {regRootInst} from './inst.js';
import morph from "./morph.js";

let root;

export function render(inst, dom = root) {
  // 记录 inst 为根组件
  regRootInst(inst);
  // 记录 dom 容器
  dom !== root && (root = dom);
  // 
  const html = inst.render();
  morph(dom, html);
}

export function renderIntoPart(html, dom) {
  const domClone = dom.cloneNode();
  domClone.removeAttribute('ref');
  const [tagOpen, tagClose] = domClone.outerHTML.split('><');
  morph(dom, tagOpen + '>' + html + '<' + tagClose);
}

export function renderToString(inst) {
  return inst.render();
}