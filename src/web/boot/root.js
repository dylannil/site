/**
 * 生成 admin 用户
 */

import {hash as bcryptHash, sha} from '../../fn/cypher/index.js';

export default async function() {
  return {
    id: 10000,
    username: 'admin',
    password: await bcryptHash(sha('123456' + 'salt')),
    email: 'your.name@gmail.com'
  };
}
