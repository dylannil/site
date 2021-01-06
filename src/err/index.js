/**
 * 自定义错误类型
 * 
 * - 分类：标志错误、系统错误、自定义错误、断言错误
 */

import {inherits, format} from 'util';

import * as BaseErrors from './base.js';
import * as WebErrors from './web.js';
import * as SvcErrors from './svc.js';
import * as FnErrors from './fn.js';

const errors = {};

[BaseErrors, WebErrors, SvcErrors, FnErrors].forEach(errs => Object.keys(errs).reduce((ret, code) => {
  const [message, base] = errs[code];
  code = code.toUpperCase();
  ret[code] = packError(code, message, base);
  return ret;
}, errors));

export default errors;

// 封装得到自定义错误类型
export function packError (code, message, Base = Error) {
  if (!code) throw new Error('自定义错误类型需要提供错误码')
  if (!message) throw new Error('自定义错误类型需要提供默认错误消息')

  code = code.toUpperCase()

  function SiteError (a, b, c) {
    if (!(this instanceof SiteError)) {
      return new SiteError(a, b, c)
    }
    Error.captureStackTrace(this, SiteError)
    this.name = 'FastifyError'
    this.code = code

    // more performant than spread (...) operator
    if (a && b && c) {
      this.message = format(message, a, b, c)
    } else if (a && b) {
      this.message = format(message, a, b)
    } else if (a) {
      this.message = format(message, a)
    } else {
      this.message = message
    }
  }
  SiteError.prototype[Symbol.toStringTag] = 'Error'

  SiteError.prototype.toString = function () {
    return `${this.name} [${this.code}]: ${this.message}`
  }

  inherits(SiteError, Base)

  return SiteError
}
