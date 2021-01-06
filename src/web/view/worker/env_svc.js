/**
 * 使用类型 IPC 的方式，远程调用主线程的 svc
 */

import {parentPort} from 'worker_threads';

export default function({tplOptions, tplLoader, tplCursor}) {  
  // 远程调用主线程中的 svc 对应接口
  // 所有调用返回后，取消消息监听
  const svcCalls = {};
  const svcBacks = data => {
    const {api, err, ret} = data;
    if (api && svcCalls[api]) {
      svcCalls[api](err, ret);
    }
  }

  return (api, tpl, ...args) => {
    const key = `ssr${tplCursor()}`;

    tplLoader.push((async () => {
      try {
        if (Object.keys(svcCalls).length === 0) {
          parentPort.on('message', svcBacks);
        }

        const p = new Promise((resolve, reject) => {
          svcCalls[api] = (err, ret) => err ? reject(err) : resolve(ret);
        });

        parentPort.postMessage({api, args});

        const ret = await p;

        tplOptions[key] = ret;
      } catch (e) {
        console.error(e);
      } finally {
        delete svcCalls[api];

        if (Object.keys(svcCalls).length === 0) {
          parentPort.off('message', svcBacks); // 不取消，会导致 worker 线程不退出
        }
      }
    })());
    
    return tpl.replace(/__PLACE_HOLDER__/g, key);
  };
}