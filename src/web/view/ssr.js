/**
 * 使用 worker 编译 markdown 并封装到 JS 源码中
 */
import path from 'path';
import {Worker} from 'worker_threads';

// 线程模块文件
const workerFile = path.join(__dirname, __filename.endsWith('ssr.js') ? './worker/loader.js' : './ssr.worker.js');

// 启动 worker 扫描
export default function(opts = {}, svc, done) {
  // 创建新的 worker 并监听其消息
  const worker = new Worker(workerFile, {
    workerData: opts
  });

  worker.on('message', async data => {
    const {api, args} = data || {};
    try {
      if (!api) {throw new Error('只支持含有 api 的远程调用');}

      const [part, func] = api.split('.');
      const inst = svc[part];
      if (!inst || !inst[func]) {throw new Error('不存在的服务 ' + api);}

      const ret = await inst[func](...args);
      worker.postMessage({api, ret});
    } catch (err) {
      worker.postMessage({api, err});
    }
  });

  worker.on('error', err => {
    done(err);
  });
  worker.on('exit', code => {
    if (code === 0) {
      done(null);
    } else {
      done(new Error('SSR 渲染错误 ' + code));
    }
  });
}
