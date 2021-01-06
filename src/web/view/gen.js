/**
 * 服务端渲染
 * 
 * - 生成帖子模块文件
 * - 生成页面显示文件
 */
import ssr from './ssr.js';

// 使用 pub 下的源码为 url 生成合适的 HTML 并封装到 HTML 文件中
export async function genPage(opts, svc) {
  // 使用元数据定位源码文件，并执行编译和封装
  await new Promise((resolve, reject) => ssr(opts, svc, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  }));
}