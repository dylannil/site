/**
 * 服务
 */

// const testSign = require('./singup');

// module.exports = () => describe('用户', () => {
//   testSign();
// });



// import auth from './auth/index.js';

import user from './user.js';


export default () => describe.skip('服务', () => {
  // auth();
  user();
});