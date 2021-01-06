/**
 * 生成定长随机字符串
 */

import Errs from '../../err/index.js';

export * from './bcrypt.js';
export * from './crypto.js';

export default function() {
  // 生成并验证，如果十次生成都没通过验证，认为出错
  return (len, verify) => {
    if (!verify) {return cypher(len);}

    for (let i = 0; i < 10; i++) {
      const code = cypher(len);
      if (verify(code)) {return code;}
    }

    throw new Errs.SE_CYPHER_VERIFIED_FAIL();
  }

  // 生成随机
  function cypher(len = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; 
    const range = chars.length;
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * range));
    }
    return result; // 简单生成指定长度的随机密码
  };
}