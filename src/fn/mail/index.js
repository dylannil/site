

import {createTransport} from 'nodemailer';
import Errs from '../../err/index.js';

export default () => {
  try {
    const mailer = createTransport({
      pool: true,
      host: 'smtp.qq.com',
      port: 465,
      secure: true, // use TLS
      auth: {
        user: 'your.name@qq.com',
        pass: 'your.passcode'
      }
    });
    return mailer; // TODO mailer 优雅的关闭
  } catch (e) {
    throw new Errs.SE_MAILER_CREATE_FAIL();
  }
}