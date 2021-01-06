/**
 * 用户注册
 */

import {Component} from '../../../ane/index.js';

export default class UserSignup extends Component {
  render() {
    const linkLogin = this.useRef();
    this.useLink(linkLogin, 'login');

    const form = this.useRef();
    this.useForm(form);
    
    return `<div class="indie-main form">
      <h1 class="indie-main-title">注册</h1>
      <div class="indie-main-desc">创建一个 YearnIO 账户</div>
      <form class="indie-main-part" action="/api/user/signup" method="post" ref="${form}">
        <div class="form-field">
          <div class="form-field-cell">
            <label class="form-field-input">
              <input type="email" name="email" />
              <span>邀请码</span>
            </label>
          </div>
          <div class="form-field-info">
            <div class="form-field-intro">联系管理员申请以获得邀请码</div>
            <div class="form-field-error">Couldn't find your Google Account</div>
          </div>
        </div>
        <div class="form-field">
          <div class="form-field-cell">
            <label class="form-field-input">
              <input type="text" name="username" />
              <span>用户名</span>
            </label>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <div class="form-field-cell">
              <label class="form-field-input">
                <input type="password" name="password" />
                <span>密码</span>
              </label>
            </div>
          </div>
          <div class="form-field">
            <div class="form-field-cell">
              <label class="form-field-input">
                <input type="password" name="password" />
                <span>确认密码</span>
              </label>
            </div>
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
            <div class="form-field-intro">需要您提供邮箱以作为联系方式</div>
            <div class="form-field-error">Couldn't find your Google Account</div>
          </div>
        </div>
        <div class="form-end">
          <div class="form-end-cell">
            <div class="form-link">
              <a href="/user/login" ref="${linkLogin}">已有账户，去登录</a>
            </div>
            <input type="submit" class="form-submit" value="注册" />
          </div>
        </div>
      </form>
    </div>`;
  }
}