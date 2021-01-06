/**
 * 入口程序
 */

import yargs from 'yargs';
import cmd from './cmd/index.js';

yargs.env('NODE_');
yargs
  .scriptName('site')
  .version().alias('v', 'version')
  .locale('zh_CN')
  // 命令注册
  .command(cmd.web())
  .command(cmd.clean())
  // .command(cmd.post())
  // .command(cmd.dump())
  // .command(cmd.doctor())
  // .command(cmd.manager())
  // 公共选项
  .options('cwd', {desc: '指定工作目录', hidden: true, default: __dirname})
  .options('env', {desc: '运行环境', default: 'production', choices: ['development', 'production']})
  .options('V', {alias: 'verbose', desc: '打印详细的输出'})
  .showHelpOnFail(true)
  .help('h').alias('h', 'help')
  .argv;
