/**
 * 忘记密码
 */

import {Component} from '../../../ane/index.js';

export default class UserRnpass extends Component {
  render() {
    const linkLogin = this.useRef();
    this.useLink(linkLogin, 'login');

    const form = this.useRef();
    this.useForm(form);
    
    return `<div class="indie-main form">
      <h1 class="indie-main-title">密码更新</h1>
      <div class="indie-main-desc">请从您收到的密码重置邮件打开此页面</div>
      <form class="indie-main-part" action="/api/user/rnpass" method="post" ref="${form}">
        <div class="form-row">
          <div class="form-field">
            <div class="form-field-cell">
              <label class="form-field-input">
                <input type="password" name="password" />
                <span>新密码</span>
              </label>
            </div>
            <div class="form-field-info">
              <div class="form-field-intro">最少 8 个字符</div>
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
        <div class="form-end">
          <div class="form-end-cell">
            <input type="submit" class="form-submit" value="更新" />
          </div>
        </div>
      </form>
    </div>`;
  }
}