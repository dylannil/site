/**
 * 忘记密码
 */

import {Component} from '../../../ane/index.js';

export default class UserUnpass extends Component {
  render() {
    const linkLogin = this.useRef();
    this.useLink(linkLogin, 'login');

    const form = this.useRef();
    this.useForm(form);

    return `<div class="indie-main form">
      <h1 class="indie-main-title">密码重置</h1>
      <div class="indie-main-desc">通过邮箱重置密码</div>
      <form class="indie-main-part" action="/api/user/unpass" method="post" ref="${form}">
        <div class="form-field">
          <div class="form-field-cell">
            <label class="form-field-input">
              <input type="text" name="username" />
              <span>用户名</span>
            </label>
          </div>
        </div>
        <div class="form-field">
          <div class="form-field-cell">
            <label class="form-field-input">
              <input type="email" name="email" />
              <span>邮箱</span>
            </label>
          </div>
          <div class="form-field-info">
            <div class="form-field-intro">请输入您注册时使用的联系邮箱</div>
            <div class="form-field-error">Couldn't find your Google Account</div>
          </div>
        </div>
        <div class="form-end">
          <div class="form-end-cell">
            <div class="form-link">
              <a href="/user/login" ref="${linkLogin}">记起密码，去登录</a>
            </div>
            <input type="submit" class="form-submit" value="重置" />
          </div>
        </div>
      </form>
    </div>`;
  }
}