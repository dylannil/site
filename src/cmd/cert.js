/**
 * 证书管理
 */

// export function doctor() {
//   return {
//     command: 'doctor',
//     desc: '对环境和应用进程诊断，以快速定位常见问题',
//     builder: yargs => yargs.options({
//       'list': {
//         desc: '列出可选的诊断项'
//       },
//       'default': {
//         desc: '运行默认的的一组诊断项'
//       },
//       'all': {
//         desc: '运行所有的诊断项'
//       },
//       'fix': {
//         desc: '尝试自动修复问题'
//       },
//       'log-file': {
//         desc: '诊断日志文件',
//         default: 'doctor.log'
//       }
//     }),
//     handler: argv => {
//       console.log(argv);
//     }
//   };
// }