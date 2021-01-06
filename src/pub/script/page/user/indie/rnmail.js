/**
 * 忘记密码
 */

import {Component} from '../../../ane/index.js';

export default class UserRnpass extends Component {
  render() {
    const linkLogin = this.useRef();
    this.useLink(linkLogin, 'login');
    
    return `<div class="indie-main form">
      <h1 class="indie-main-title">邮箱验证</h1>
      <div class="indie-main-desc">请从您收到的邮箱验证邮件打开此页面</div>
      <p class="indie-main-part">loading...</p>
    </div>`;
  }
}