/**
 * 为 SSR 的运行时环境添加功能
 */
import template from 'lodash.template';
// import post, {getPostJsFile} from './env_post.js';
import svc from './env_svc.js';

import {formatDate} from '../../../pub/script/util/format.js';

let cursor = 0;
 
export const tplOptions = {};
export const tplLoader = [];

export const tplCursor = () => cursor++;

globalThis.SSR = {
  // post: post({tplOptions, tplLoader, tplCursor}),
  svc: svc({tplOptions, tplLoader, tplCursor})
};

// export {getPostJsFile};

export async function tplRender(html) {
  // 不存在 loader 则生成了无数据模板，不需要填充数据
  if (!Object.keys(tplLoader).length) {return html;}

  // 等待所有加载器完成
  for await (let _ of tplLoader) {}

  // 将最终得到的数据填充到模板中
  const tpl = template(html, {
    imports: {
      formatDate
    }
  });

  return tpl(tplOptions);
}
