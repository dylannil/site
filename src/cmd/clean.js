/**
 * 缓存文件清理
 * 
 * - 清理生成的页面文件
 * - 清理生成的帖子文件
 */
import path from 'path';
import fs from 'fs';
import glob from 'fast-glob';

export default function() {
  return {
    command: 'clean',
    desc: '清理硬盘上的缓存文件',
    builder: yargs => yargs.options({
      'db': {
        desc: '删除数据库文件，以清理数据',
        hidden: true
      },
      'hard': {
        desc: '不区分是否有效，删除所有缓存文件，所有页面需要重新渲染'
      },
      'dist': {
        desc: '清理打包后待发布的目录'
      }
    }),
    handler: async argv => {
      const cwd = argv.cwd;
      if (argv.hard) {
        // 完全清理两个目录
        await fs.promises.rmdir(path.join(cwd, 'post'), {recursive: true});
        await fs.promises.rmdir(path.join(cwd, 'page'), {recursive: true});
        console.log('清理缓存完成');
      } else if (argv.dist) {
        // 完全清理 dist 目录
        await fs.promises.rmdir(path.join(cwd, '../dist'), {recursive: true});
        console.log('清理 dist 完成');
      } else if (argv.db) {
        // 清理数据库
        if (argv.env === 'development') {
          try {
            await fs.promises.unlink(path.join(cwd, '../res/db/data'));
          } catch (e) {
            if (e.code !== 'ENOENT') {
              throw e;
            }
          }
        } else {
          console.log(`清理整个数据库的操作，只支持开发环境下执行`);
        }
      } else {
        // 清理过时帖子文件
        const post = path.join(cwd, 'post');
        const files = await glob(['**/*.html', '**/*.js'], {cwd: post});
        const cache = {};
        for (let i = 0, len = files.length; i < len; i++) {
          const file = files[i];
          if (file.endsWith('.js')) {
            const html = file.replace(/\.js$/, '').replace(/_[^_]{8}$/, '') + '.html';
            if (!(html in cache) && files.includes(html)) {
              cache[html] = await fs.promises.readFile(path.join(post, html), 'utf8');
            }
            if (!(cache[html] || '').includes(`['/${file.replace(/\\/g, '/')}']`)) {
              // html 文件内没有对对应文件的记录，则移除 JS 文件
              // 没有渲染 html 的帖子 JS 文件，同样会被清理
              await fs.promises.unlink(path.join(post, file));
            }
          }
        }
      }
    }
  };
}