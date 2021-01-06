/**
 * 用户服务
 */
import Errs from '../err/index.js';

export default class {
  constructor(opts) {
    this.init(opts);

    this.clearBlackList(); // 每次重启执行一次清理
  }
  init(opts = {}) {
    if (!opts.dao) {throw new Error('服务 user 需要指定数据源');}
    if (!opts.cypher) {throw new Error('服务 user 需要指定随机码生成模块');}
    if (!opts.bcrypt) {throw new Error('服务 user 需要指定密码哈希模块');}
    if (!opts.mailer) {throw new Error('服务 user 需要指定邮件发送模块');}
  
    this.dao = opts.dao;
    this.cypher = opts.cypher;
    this.bcrypt = opts.bcrypt;
    this.mailer = opts.mailer;
  }




  async login(username, password) {
    const {user: dao} = this.dao;

    // 验证密码
    const ret = dao.getUserPassByUsername(username);
    if (!ret) {throw new Errs.SE_USER_NOT_EXIST(username);}
    const verified = await this.bcrypt.verify(password, ret.password);
    if (!verified) {throw new Errs.SE_USER_PASSWORD_WRONG();}

    // 更新 last_login
    dao.runUpdateUserLastLogin(ret.id);

    return ret.id;
  }
  async logout(token, expire) {
    if (!token) {return ;}
    if (!expire || expire < Date.now() / 1000) {return ;}

    const {user: dao} = this.dao;
    const signature = token.split('.').pop();

    const record = dao.getUserBlackListByToken(signature);
    if (!record) {
      dao.runInsertUserBlackListShort({token: signature, expire});
      this.clearBlackList(true); // 非即时清理
    }
  }


  async clearBlackList(norealtime) {
    const {user: dao} = this.dao;
    norealtime || dao.runDeleteUserBlackListExpired();
    // 检查是否还存在黑名单记录，如果没有则不启动新的定时器
    const rec = dao.getUserBlackListNotEmpty();
    if (!rec) {return ;}
    // 每隔 2 小时，触发一次黑名单清理任务，任务等待 2 小时后执行清理
    // 在计时器到点前程序重启，会导致部分记录无法及时清理，在重启时执行清理
    const now = Math.floor(Date.now() / 1000);
    if (!this._blackListClearTimer || this._blackListClearTimer < now) {
      this._blackListClearTimer = now + 7200;
      setTimeout(() => {
        this._blackListClearTimer = null;
        this.clearBlackList(); // 循环
      }, 7200000);
    }
  }


  async getUserInfo(id) {
    if (!id) {throw new Errs.SE_SHOULD_NOT_EMPTY('id');}

    return this.dao.user.getUserInfo(id);
  }
  async isTokenInBlackList(token) {
    const signature = token.split('.').pop();
    return !!this.dao.user.getUserBlackListByToken(token);
  }





  async createInviteCode() {
    const {user: dao} = this.dao;
  
    // 生成随机邀请码，确保数据库内不重复
    let code;
    for (let i = 0; i < 10; i++) {
      code = this.cypher();
      const ret = dao.getUserInviteCodeByCode(code);
      if (ret) {
        code = undefined;
      } else {
        break;
      }
    }
    if (!code) {throw new Errs.SE_USER_CODE_GENERATE_FAIL();}

    // 保存入库
    dao.runInsertUserInviteCodeShort(code);
  
    // 返回
    return code;
  }
  async getAllInviteCode() {
    const {user: dao} = this.dao;

    const list = dao.allUserInviteCode();

    return list || [];
  }
  async signup({username, password, passcode, email} = {}) {
    if (!username) {throw new Errs.SE_USER_NEED_USERNAME();}
    if (!password) {throw new Errs.SE_USER_NEED_PASSWORD();}
    if (!passcode) {throw new Errs.SE_USER_NEED_PASSCODE();}
    if (!email) {throw new Errs.SE_USER_NEED_EMAIL();}

    const {user: dao} = this.dao;

    const existUser0 = dao.getUserExistUsername(username);
    if (existUser0) {throw new Errs.SE_USER_SINGUP_CONFLICT_USERNAME();}

    const existUser1 = dao.getUserExistEmail(email);
    if (existUser1) {throw new Errs.SE_USER_SINGUP_CONFLICT_EMAIL();}

    const inviteCode = dao.getUserInviteCodeByCode(passcode);
    if (!inviteCode) {throw new Errs.SE_USER_SINGUP_INVALID_PASSCODE();}
    if (inviteCode.createdAt < (Date.now() / 1000 - 172800)) {throw new Errs.SE_USER_SINGUP_EXPIRED_PASSCODE();}

    // 加密密码
    const hashed = this.bcrypt.hash(password);

    this.dao.trx(() => {
      dao.runInsertUserShort({username, password: hashed, email});
      dao.runDeleteUserInviteCode(inviteCode.id);
    })();
  }




  // 
  async unpass(username, email) {
    if (!username) {throw new Errs.SE_USER_NEED_USERNAME();}
    if (!email) {throw new Errs.SE_USER_NEED_EMAIL();}

    const {user: dao} = this.dao;

    const existUser = dao.getUserExistUsernameAndEmail({username, email});
    if (!existUser) {throw new Errs.SE_USER_NOT_EXIST();}

    // 生成密码重置工单号
    // 生成随机邀请码，确保数据库内不重复
    let code;
    for (let i = 0; i < 10; i++) {
      code = this.cypher();
      const ret = dao.getUserPassResetByCode(code);
      if (ret) {
        code = undefined;
      } else {
        break;
      }
    }
    if (!code) {throw new Errs.SE_USER_CODE_GENERATE_FAIL();}

    dao.runInsertPassResetShort({uid: existUser.id, code});

    // 发送邮件
    await this.mailer.sendMail({
      from: 'xiaoboleee@qq.com',
      to: email,
      subject: '密码重置',
      text: `您在 https://yearnio.com 上的账户申请了密码重置\n\n请打开 https://yearnio.com/user/rnpass?code=${code} 重设密码`
    });
  }
  async rnpass(passcode, password) {
    const {user: dao} = this.dao;

    const resetCode = dao.getUserPassResetByCode(passcode);
    if (!resetCode) {throw new Errs.SE_USER_RNPASS_INVALID_PASSCODE();}
    if (resetCode.createdAt < (Date.now() / 1000 - 172800)) {throw new Errs.SE_USER_RNPASS_EXPIRED_PASSCODE();}

    const hashed = this.bcrypt.hash(password);

    this.dao.trx(() => {
      dao.runUpdateUserPassword({id: resetCode.uid, password: hashed});
      dao.runDeleteUserPassReset({id: resetCode.id});
    })();
  }
  async uppass(id, password, password1) {
    const {user: dao} = this.dao;

    const existUser = dao.getUserPass(id);
    if (!existUser) {throw new Errs.SE_USER_NOT_EXIST();}

    const verified = await this.bcrypt.verify(password, existUser.password);
    if (!verified) {throw new Errs.SE_USER_UPPASS_INVALID_PASSWORD();}

    // 加密新密码
    const hashed = await this.bcrypt.hash(password1);
    dao.runUpdateUserPassword({id, password: hashed});
  }





  async unmail(uid) {
    if (!uid) {throw new Errs.SE_USER_NEED_USER_ID();}

    const {user: dao} = this.dao;

    const existUser = dao.getUser({id: uid});
    if (!existUser) {throw new Errs.SE_USER_NOT_EXIST();}
    if (existUser.verifiedAt) {throw new Errs.SE_USER_MAIL_VERIFIED();}

    // 生成密码重置工单号
    // 生成随机邀请码，确保数据库内不重复
    let code;
    for (let i = 0; i < 10; i++) {
      code = this.cypher();
      const ret = dao.getUserMailVerifyByCode(code);
      if (ret) {
        code = undefined;
      } else {
        break;
      }
    }
    if (!code) {throw new Errs.SE_USER_CODE_GENERATE_FAIL();}

    dao.runInsertMailVerifyShort({uid, code});

    // 发送邮件
    await this.mailer.sendMail({
      from: 'xiaoboleee@qq.com',
      to: existUser.email,
      subject: '邮箱验证',
      text: `您在 https://yearnio.com 上的账户申请了邮箱雁阵\n\n请打开 https://yearnio.com/user/rnmail?code=${code} 完成验证`
    });
  }
  async rnmail(passcode) {
    const {user: dao} = this.dao;

    const verifyCode = dao.getUserMailVerifyByCode(passcode);
    if (!verifyCode) {throw new Errs.SE_USER_RNMAIl_INVALID_PASSCODE();}
    if (verifyCode.createdAt < (Date.now() / 1000 - 172800)) {throw new Errs.SE_USER_RNMAIl_EXPIRED_PASSCODE();}

    this.dao.trx(() => {
      dao.runUpdateUserEmailVerified({id: verifyCode.uid});
      dao.runDeleteUserMailVerify({id: verifyCode.id});
    })();
  }
  async upmail(id, email) {
    const {user: dao} = this.dao;

    const emailExist = dao.getUserExistEmail(email);
    if (emailExist) {
      if (emailExist.id !== id) {
        throw new Errs.SE_USER_EMAIL_EXIST();
      } else {
        return ; // 不需要更新
      }
    }

    const existUser = dao.getUserInfo(id);
    if (!existUser) {throw new Errs.SE_USER_NOT_EXIST();}

    dao.runUpdateUserEmail({id, email});
  }
  async upname(id, username) {
    const {user: dao} = this.dao;

    const usernameExist = dao.getUserExistUsername(username);
    if (usernameExist) {
      if (usernameExist.id !== id) {
        throw new Errs.SE_USER_NAME_EXIST();
      } else {
        return ; // 不需要更新
      }
    }

    const existUser = dao.getUserInfo(id);
    if (!existUser) {throw new Errs.SE_USER_NOT_EXIST();}

    dao.runUpdateUserName({id, username});
  }
}