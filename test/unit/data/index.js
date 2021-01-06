/**
 * 数据源
 */

import user from './user.js';
import post from './post.js';
import date from './date.js';

export default () => describe('数据', () => {
  user();
  post();
  date();
});