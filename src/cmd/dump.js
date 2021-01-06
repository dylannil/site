/**
 * 转储 - 备份和快照
 */

import os from 'os';

export function dump() {
  return {
    command: 'dump',
    desc: '转储和压缩所有相关文件和数据库到压缩包，可用于备份数据',
    builder: yargs => yargs.options({
      'f': {
        alias: 'file',
        desc: '创建该名文件以保持转储压缩的数据',
        default: `home_dump_${Date.now() / 1000 | 0}.zip`,
      },
      't': {
        alias: 'tempdir',
        desc: '临时存储目录',
        default: os.tmpdir
      },
      'L': {
        alias: 'skip-log',
        desc: '跳过日志数据文件的转储'
      },
      'O': {
        alias: 'only',
        desc: '只转储指定类型数据',
        choice: ['log', 'data', 'code']
      }
    }),
    handler: argv => {
      console.log(argv);
    }
  };
}
