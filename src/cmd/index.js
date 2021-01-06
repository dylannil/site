/**
 * 命令
 */

import web from './web.js'
import clean from './clean.js';
// import dump from './dump.js';
// import doctor from './doctor.js';
// import manager from './manager.js';

export default {web, clean};

// 所有功能通用的最终错误捕获
process.on('uncaughtException', (err, origin) => {
  console.error(err, origin);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error(reason, promise);
});