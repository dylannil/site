/**
 * 加密和比较
 */

import bcrypt from 'bcrypt';

export function verify(password, hashed) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hashed, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
}
export function hash(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hashed) => {
      err ? reject(err) : resolve(hashed);
    });
  });
}