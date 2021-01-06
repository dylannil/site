/**
 * 服务启动
 */
import path from 'path';
import fs from 'fs';
import fastify from "fastify";
import fastifyHttp from 'fastify-http2https';
import rotatingStream from 'file-stream-rotator';

import root from './root.js';
import svc, {init as svcInit} from '../../svc/index.js';
import cypher, * as bcrypt from '../../fn/cypher/index.js';
import mailer from '../../fn/mail/index.js';

export default class Boot {
  static new(opts) {
    return new Boot(opts);
  }
  constructor({
    cwd = path.join(process.cwd(), 'dist'),
    key = '../res/crt/yio.key',
    crt = '../res/crt/yio.crt',
    db = '../res/db/data',
    env = 'production'
  } = {}) {
    const opts = {};
    if (key && crt) {
      opts.http2 = true;
      opts.https = {
        key: fs.readFileSync(path.join(cwd, key)),
        cert: fs.readFileSync(path.join(cwd, crt)),
        allowHTTP1: true,
        ALPNProtocols: ['h2', 'http/1.1']
      };
      // 自动重定向 http 到 https
      opts.serverFactory = fastifyHttp({http: false});
    }
    if (env === 'development') {
      opts.logger = {level: 'trace', prettyPrint: true};
      opts.disableRequestLogging = false;
    } else {
      const logFile = path.join(cwd, '../res/log/site_%DATE%.log');
      fs.mkdirSync(path.dirname(logFile), {recursive: true});
      const stream = rotatingStream.getStream({
        filename: logFile,
        frequency: 'daily',
        date_format: 'YYYY-MM-DD',
        size: '5m', // 1k 约 5-6 条记录
        max_logs: 10,
        verbose: false
      });
      opts.logger = {level: 'info', prettyPrint: false, stream};
      opts.disableRequestLogging = true;
    }
    this.app = fastify(opts);
    this.app.env = env;
    this.app.cwd = cwd;
    this.app.dbFile = path.join(cwd, db);
  }
  async boot() {
    // 错误响应
    // this.app.setNotFoundHandler(async function(req, reply) {
    //   reply.send('404 not found xxx');
    // });
    // this.app.setErrorHandler(async function(err, req, reply) {
    //   var statusCode = err.statusCode;
    //   if (statusCode >= 500) {
    //     this.log.error('#####', err);
    //   } else if (statusCode >= 400) {
    //     this.log.info('#####', err);
    //   } else {
    //     this.log.error('#####', err);
    //   }
    //   reply.send('err from hook');
    // });

    // 
    await svcInit({dbFile: this.app.dbFile}, root);
  }
  async config(...plugins) {
    const svcInsts = {};
    svcInsts.user = svc.User.new({
      svc: svcInsts,
      cypher: cypher(),
      bcrypt,
      mailer: mailer()
    });
    svcInsts.auth = svc.Auth.new({
      svc: svcInsts,
    });
    svcInsts.case = svc.Case.new({
      svc: svcInsts,
    });
    svcInsts.conf = svc.Conf.new({
      svc: svcInsts,
    });
    svcInsts.sys = svc.Sys.new({
      svc: svcInsts,
    });

    // 权限管理模块需要等待异步加载数据
    await svcInsts.auth.ready;
    
    for (const plugin of plugins) {
      plugin(this.app, {svc: svcInsts});
    }
  }
  listen(port, address = '0.0.0.0') {
    const app = this.app;
    app.listen(port, address, (err, address) => {
      if (err) {
        console.error(err);
      } else if (app.env === 'development') {
        app.log.info(app.printRoutes());
      }
    })
  }
};
