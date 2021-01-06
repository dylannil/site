/**
 * 用户登录
 */

import {Component} from '../../../ane/index.js';
import sha from '../util/hash.js';

export default class UserLogin extends Component {
  render() {
    const linkUnpass = this.useRef();
    const linkSignup = this.useRef();
    this.useLink(linkUnpass, 'unpass');
    this.useLink(linkSignup, 'signup');

    const {dispatch} = this.useSession();

    const form = this.useRef();
    this.useForm(form, {
      submit: async (e, hint) => {
        const form = e.target;
        let flag;
        
        const username = form.username.value.trim();
        flag = hint('username', !username ? '用户名不可为空' :
          username.length < 4 ? '用户名至少需要 4 个字符' :
          username.length > 15 ? '用户名最多可容纳 15 个字符' :
          -1) || flag;

        let password = form.password.value.trim();
        flag = hint('password', !password ? '密码不可为空' :
          password.length < 6 ? '密码至少需要 6 个字符' :
          -1) || flag;

        if (flag) {return ;}

        try {
          const ret = await this.ajax('user/login', {
            method: 'POST',
            data: {
              username,
              password: await sha(password)
            }
          });
          dispatch('setUser', ret);
          this.navTo('/user');
        } catch (e) {
          switch (e.code) {
            case 'SE_USER_NOT_EXIST':
              hint('username', '用户不存在');
              break;
            case 'SE_USER_PASSWORD_WRONG':
              hint('password', '密码错误，请检查后重试');
              break;
            default:
              hint(e.message);
          }
        }
      }
    });

    return `<div class="indie-main form">
      <h1 class="indie-main-title">登录</h1>
      <div class="indie-main-desc">欢迎来到 YearnIO</div>
      <form class="indie-main-part" action="/api/user/login" method="post" ref="${form}">
        <div class="form-field">
          <div class="form-field-cell">
            <label class="form-field-input">
              <input type="text" name="username" />
              <span>用户名(可选 admin)</span>
            </label>
          </div>
        </div>
        <div class="form-field">
          <div class="form-field-cell">
            <label class="form-field-input">
              <input type="password" name="password" />
              <span>密码(可选 123456)</span>
            </label>
          </div>
          <div class="form-field-link">
            <a href="/user/unpass" ref="${linkUnpass}">忘记密码？</a>
          </div>
        </div>
        <div class="form-end">
          <div class="form-end-cell">
            <div class="form-link">
              <a href="/user/signup" ref="${linkSignup}">创建一个用户</a>
            </div>
            <input type="submit" class="form-submit" value="登录" />
          </div>
          <div class="form-end-info">
            <div class="form-end-error">登录失败</div>
          </div>
        </div>
      </form>
    </div>`;
  }
}
