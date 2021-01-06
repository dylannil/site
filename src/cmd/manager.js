/**
 * 关闭、重启、清空日志
 */

export function manager() {
  return {
    command: 'manager',
    desc: '应用维护和管理',
    builder: yargs => yargs.options({
      'shutdown': {
        desc: '关闭应用'
      },
      'restart': {
        desc: '重启应用'
      }
    }),
    handler: argv => {
      console.log(argv);
    }
  };
}