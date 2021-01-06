/**
 * 插件
 */
import sensible from './sensible.js';
// import cypher from './cypher.js'
// import mailer from './mailer.js'
import helmet from './helmet.js'
import ratelimit from './ratelimit.js'
import compress from './compress.js'
import cookie from './cookie.js'
import jwt from './jwt.js'
import csrf from './csrf.js'
import health from './health.js'
import multipart from './multipart.js'
import serveStatic from './static.js';

import auth from './auth.js';

export default {
  sensible,
  // cypher,
  // mailer,
  helmet,
  ratelimit,
  compress,
  cookie,
  jwt,
  csrf,
  health,
  multipart,
  serveStatic,
  auth
};