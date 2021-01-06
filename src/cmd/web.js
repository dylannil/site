/**
 * WEB 服务，可选开关 http 和 grpc 协议
 */
import web from '../web/index.js';
import rpc from '../rpc/index.js';

export default function() {
  return {
    command: ['$0', 'web'],
    desc: '启动网络服务',
    builder: yargs => {
      yargs.options({
        'p': {
          alias: 'port',
          group: '服务:',
          desc: '临时指定端口，可用于避免端口冲突',
          default: 8128
        },
        'no-http2': {
          group: '服务:',
          desc: '是否禁用 HTTP2 服务'
        },
        'rpc': {
          group: '服务:',
          desc: '是否启用 GRPC 服务，启动后 HTTP 服务不支持 2.0 协议'
        },
        'db': {
          group: '服务:',
          desc: '数据库文件位置',
          hidden: true,
          default: '../res/db/data'
        },
        'post': {
          group: '服务:',
          desc: '帖子源码根目录',
          hidden: true,
          default: '../../post'
        }
      });
    },
    handler: argv => {
      web(argv);
    }
  };
}
