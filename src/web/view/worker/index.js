/**
 * 使用 worker 大约消耗 60ms 时间
 * 实测发现 jsdom 性能非常低，平均需要 900ms 启动时间
 */
import path from 'path';
import fs from 'fs';
import {workerData} from 'worker_threads';

import {tplRender} from './env.js';
import * as pub from '../../../pub/index.js';



(async () => {
  const {href, dist, file} = workerData;
  const isPrd = /(\\|\/)dist(\\|\/)/.test(__filename);

  let tplStatic;
  if (isPrd) {
    tplStatic = SSR.svc('sys.getPubHash', `
      <link rel="stylesheet" href="/index<% if (__PLACE_HOLDER__ && __PLACE_HOLDER__.css) {%>.<%= __PLACE_HOLDER__.css %><% } %>.css" />
      <script async src="/index<% if (__PLACE_HOLDER__ && __PLACE_HOLDER__.js) {%>.<%= __PLACE_HOLDER__.js %><% } %>.js"></script>`);
  } else {
    tplStatic = `
      <link rel="stylesheet" href="/index.css" />
      <script type="module" src="/index.js"></script>`;
  }

  // 渲染到字符串，得到模板
  const tpl = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      <meta name="description" content="“高山仰止，景行行止。”虽不能至，然心乡往之。" />
      <title>YEARN | 向往</title>${tplStatic}
    </head>
    <body>
      <!--[if IE]><div class="ie-warn">本站不兼容 IE 浏览器，请考虑使用其他浏览器打开</div><![endif]-->
      <noscript>本站需要您的浏览器支持并开启 JavaScript 的运行</noscript>
      ${pub.renderToString(new URL(href))}
    </body>
  </html>`;

  const html = await tplRender(tpl);

  // 最小化
  const htmlMin = html;

  // 写入到目标文件
  const fileOut = path.join(dist, file);
  await fs.promises.mkdir(path.dirname(fileOut), {recursive: true});
  await fs.promises.writeFile(fileOut, htmlMin, 'utf8');
})();