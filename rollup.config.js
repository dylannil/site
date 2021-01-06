import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import replace from 'rollup-plugin-re';
import filesize from 'rollup-plugin-filesize';
import {terser} from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import progress from 'rollup-plugin-progress';
import visualizer from 'rollup-plugin-visualizer';

import fse from 'fs-extra';
import stylus from 'stylus';
import nib from 'nib';

const pkg = require('./package.json');

const globals = [
  'fs', 'path', 'child_process', 'worker_threads',
  'http', 'https', 'http2', 'net', 'tls',
  'events', 'crypto', 'constants',
  'dns', 'stream', 'zlib', 'string_decoder',
  'os', 'util', 'assert', 'vm'
];

export default (argv) => {
  const prod = !(argv.production === false || argv.prod === false);
  delete argv.prod;
  delete argv.production;
  
  let srv = argv.srv;
  srv && (delete argv.srv);
  let pub = argv.pub;
  pub && (delete argv.pub);
  if (!srv && !pub) {
    srv = pub = true;
  }
  return [
    ...(srv ? [taskSrv(argv, prod)] : []),
    ...(pub ? [taskPub(argv, prod)] : [])
  ];
};

// 一个主模块，两个 worker 线程模块
function taskSrv(argv, prod) {
  console.log('模块 srv 打包');
  return {
    input: {
      index: path.join(__dirname, 'src/index.js'),
      'ssr.worker': path.join(__dirname, 'src/web/view/worker/index.js')
    },
    output: {
      dir: path.join(__dirname, 'dist/'),
      format: 'cjs',
      sourcemap: true
    },
    external: id => {
      if (id in pkg.dependencies) {
        return true;
      } else if (id in pkg.devDependencies) {
        return true;
      } else if (globals.includes(id)) {
        return true;
      } else {
        return false;
      }
    },
    plugins: [
      prod && terser(),
      resolve(),
      commonjs(),
      progress(),
      visualizer({
        filename: './dist/stat_srv.html',
        title: '服务端源码构成',
        sourcemap: true,
        template: 'treemap' // sunburst, treemap, network
      }),
      filesize()
    ],
  };
}

// 渲染进程所有源码打包到一个 index.js 文件
function taskPub(argv, prod) {
  console.log('模块 pub 打包');

  let hashCSS;
  
  return {
    input: path.join(__dirname, `src/pub/index.js`),
    output: {
      dir: path.join(__dirname, `dist/pub/`),
      entryFileNames: '[name].[hash].js',
      name: 'app',
      format: 'iife',
      sourcemap: 'hidden',
      inlineDynamicImports: true,
      exports: 'auto'
    },
    external: id => {
      if (/^(electron|fs|path|child_process|http|events|crypto)$/.test(id)) {
        return true;
      } else {
        return false;
      }
    },
    plugins: [
      babel({
        exclude: 'node_modules/**'
      }),
      replace({patterns: [
        {
          transform(code, id) {
            if (id.endsWith('.js')) {
              const dir = path.dirname(id);
              const list = [];
              if (/_\.import\('([^']+\.css)', import\.meta\)/.test(code)) {
                code = code.replace(/_\.import\('([^']+\.css)', import\.meta\)/g, (f, p) => {
                  const abs = path.relative(path.join(__dirname, 'src/pub'), path.join(dir, p));
                  list.push(p);
                  return `_.import('/${abs.replace(/\\/g, '/')}')`;
                });
              }
              if (/_\.import\('([^']+\.js)', import\.meta\)/.test(code)) {
                code = code.replace(/_\.import\('([^']+\.js)', import\.meta\)/g, (f, p) => {
                  const abs = path.relative(path.join(__dirname, 'src/pub'), path.join(dir, p));
                  return `_.import('/${abs.replace(/\\/g, '/')}')`;
                });
              }
              return list.map(p => `import '${p}';`).join('\n') + (list.length ? '\n' : '') + code;
            }
            return code;
          }
        }
      ]}),
      copy({
        targets: [
          {src: 'src/pub/index.styl', dest: 'dist/', rename: 'index.[hash].css', transform: content => {
            return new Promise((resolve, reject) => {
              // 修正 0fr 被压缩成 0 的问题
              stylus.Compiler.prototype.visitUnit = function(unit){
                var type = unit.type || ''
                  , n = unit.val
                  , float = n != (n | 0);
                if (this.compress) {
                  // 百分数、时间之外的所有为 0 的值只显示 0
                  // grid-template-columns 中 0fr 和 0 并不相同
                  if ('%' != type && 's' != type && 'ms' != type && 'fr' != type && 0 == n) return '0';
                  if (float && n < 1 && n > -1) {
                    return n.toString().replace('0.', '.') + type;
                  }
                }
                return (float ? parseFloat(n.toFixed(15)) : n).toString() + type;
              };
              // 实现自动附加 hash 的需求
              fse.outputFileBak = fse.outputFile;
              fse.outputFile = function(file, ...args) {
                file = file.replace(/\[hash\]/, hashCSS);
                fse.outputFile = fse.outputFileBak;
                return fse.outputFile.call(this, file, ...args);
              }
              // 渲染
              const renderer = stylus(content.toString(), {
                compress: prod,
                filename: 'index.css',
                sourcemap: 'hidden',
                use: [nib()],
                imports: ['nib'],
                paths: [path.join(__dirname, 'src/pub')]
              });
              renderer.render(async function (err, css) {
                if (err) {
                  reject(err);
                } else {
                  if (prod) {
                    css = css.replace(/\/\*\# sourceMappingURL=index\.css\.map \*\/$/, '');
                    hashCSS = crypto.createHash('sha256')
                      .update(css)
                      .digest('hex')
                      .slice(0, 8);
                    const file = path.join(__dirname, `dist/pub/index.${hashCSS}.css.map`);
                    await fs.promises.mkdir(path.dirname(file), {recursive: true});
                    await fs.promises.writeFile(file, JSON.stringify(renderer.sourcemap), 'utf8');
                    resolve(css);
                  } else {
                    const file = path.join(__dirname, 'dist/pub/index.css.map');
                    await fs.promises.mkdir(path.dirname(file), {recursive: true});
                    await fs.promises.writeFile(file, JSON.stringify(renderer.sourcemap), 'utf8');
                    resolve(css);
                  }
                }
              });
            });
          }},
          {src: 'src/pub/favicon.ico', dest: 'dist/'}
        ],
        flatten: false
      }),
      visualizer({
        filename: `./dist/stat_pub.html`,
        title: '网页端源码构成',
        sourcemap: true,
        template: 'treemap' // sunburst, treemap, network
      }),
      prod && terser(),
      progress(),
      filesize(),
      prod && {
        name: 'stats', // this name will show up in warnings and errors
        // resolveId ( source ) {
        //   if (source === 'virtual-module') {
        //     return source; // this signals that rollup should not ask other plugins or check the file system to find this id
        //   }
        //   return null; // other ids should be handled as usually
        // },
        // load ( id ) {
        //   if (id === 'virtual-module') {
        //     return 'export default "This is virtual!"'; // the source code for "virtual-module"
        //   }
        //   return null; // other ids should be handled as usually
        // },
        async generateBundle(outputOptions, outputBundle = {}) {
          const hashJS = (Object.keys(outputBundle)[0] || '').split('.')[1];

          await fs.promises.writeFile(path.join(__dirname, `dist/pub.json`), JSON.stringify({
            js: hashJS,
            css: hashCSS
          }), 'utf8');
        }
      }
    ],
  };
}
