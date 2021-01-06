/**
 * 用户中心
 * 
 * - 登录态
 * - 用户名、邮箱 更新
 * - 标签组：密码修改、用户管理、案例管理、文章管理、榜单管理
 */
import {Component} from '../../../ane/index.js';
import sha from '../util/hash.js';

export default class UserSelf extends Component {
  render() {
    const side = this.useRef();
    const main = this.useRef();

    this.useEffect(() => {
      const domSide = this.ref(side);
      const domMain = this.ref(main);
      if (!domSide || !domMain) {return ;}

      const listener = e => {
        let line = e.target;
        let key;
        while (line !== domSide) {
          key = line.getAttribute('key');
          if (key) {break;}
          line = line.parentElement;
        }
        if (!line || line === domSide) {return ;}
        // 
        let child = domSide.firstChild;
        while (child) {
          if (child.nodeType === 1) {
            child.classList.toggle('checked', child === line);
          }
          child = child.nextElementSibling;
        }
        // 
        child = domMain.firstChild;
        while (child) {
          if (child.nodeType === 1) {
            child.classList.toggle('hide', child.getAttribute('key') !== key);
          }
          child = child.nextElementSibling;
        }
      };

      domSide.addEventListener('click', listener);
      return () => {
        domSide.removeEventListener('click', listener);
      }
    }, [], 'self');

    const formPass = this.useRef();
    this.useForm(formPass, 'pass', {
      submit: async (e, hint) => {
        const form = e.target;
        let flag;
        
        let password = form.password.value.trim();
        flag = hint('password', !password ? '密码不可为空' :
          password.length < 6 ? '密码至少需要 6 个字符' :
          -1) || flag;
        
        let password1 = form.password1.value.trim();
        flag = hint('password1', !password1 ? '密码不可为空' :
          password1.length < 6 ? '密码至少需要 6 个字符' :
          -1) || flag;
        
        let password2 = form.password2.value.trim();
        flag = hint('password2', password2 !== password1 ? '两次密码输入不相同' :
          -1) || flag;

        if (flag) {return ;}

        try {
          await this.ajax('user/uppass', {
            method: 'POST',
            data: {
              password: await sha(password),
              password1: await sha(password1)
            }
          });
          // 
          alert('密码修改完成');
        } catch (e) {
          console.error(e);
        }
      }
    });

    const formMail = this.useRef();
    this.useForm(formMail, 'mail', {
      submit: async (e, hint) => {
        const form = e.target;
        let flag;
        
        let email = form.email.value.trim();
        flag = hint('email', !email ? '密码不可为空' :
          email.length < 6 ? '密码至少需要 6 个字符' :
          -1) || flag;

        if (flag) {return ;}

        try {
          await this.ajax('user/upmail', {
            method: 'POST',
            data: {email}
          });
          // 
          alert('邮箱更新成功');
          // todo 更新当前页面顶部邮箱显示
        } catch (e) {
          console.error(e);
        }
      }
    });


    const formName = this.useRef();
    this.useForm(formName, 'name', {
      submit: async (e, hint) => {
        const form = e.target;
        let flag;
        
        const username = form.username.value.trim();
        flag = hint('username', !username ? '用户名不可为空' :
          username.length < 4 ? '用户名至少需要 4 个字符' :
          username.length > 15 ? '用户名最多可容纳 15 个字符' :
          -1) || flag;

        if (flag) {return ;}

        try {
          await this.ajax('user/upname', {
            method: 'POST',
            data: {username}
          });
          // 
          alert('用户名更新成功');
          // todo 更新当前页面顶部邮箱显示
        } catch (e) {
          console.error(e);
        }
      }
    });

    return `<div class="board-self">
      <div class="board-self-side" ref="${side}">
        <div class="checked" key="name">名称</div>
        <div key="email">邮箱</div>
        <div key="password">密码</div>
      </div>
      <div class="board-self-main" ref="${main}">
        <div key="name">
          <div class="board-self-cell">
            <p class="board-self-info">用户名可以在此更改</p>
            <form action="/api/user/upname" method="post" ref="${formName}">
              <div class="form-field">
                <div class="form-field-cell">
                  <label class="form-field-input">
                    <input type="text" name="username" />
                    <span>新的用户名</span>
                  </label>
                </div>
              </div>
              <div class="form-end">
                <div class="form-end-cell">
                  <input type="submit" class="form-submit" value="更新" />
                </div>
              </div>
            </form>
          </div>
        </div>
        <div class="hide" key="email">
          <div class="board-self-cell">
            <p class="board-self-info">您的电子邮箱需要验证</p>
            <p class="board-self-play">您的电子邮箱还未通过验证，请检查收件箱是否收到验证邮件。如果未收到，请<a>重发验证邮件</a>。打开验证邮件中的链接，即可完成验证操作；请注意长时间未使用的验证链接可能会过期失效。</p>
          </div>
          <div class="board-self-cell">
            <p class="board-self-info">您的电子邮箱可以在此修改，修改后需要重新认证</p>
            <form action="/api/user/upmail" method="post" ref="${formMail}">
              <div class="form-field">
                <div class="form-field-cell">
                  <label class="form-field-input">
                    <input type="email" name="email" />
                    <span>新的邮箱</span>
                  </label>
                </div>
                <div class="form-field-info">
                  <div class="form-field-intro">请确保输入的是可用的邮箱</div>
                  <div class="form-field-error"></div>
                </div>
              </div>
              <div class="form-end">
                <div class="form-end-cell">
                  <input type="submit" class="form-submit" value="更新" />
                </div>
              </div>
            </form>
          </div>
        </div>
        <div class="hide" key="password">
          <div class="board-self-cell">
            <p class="board-self-info">您的账户密码可以在此修改</p>
            <form action="/api/user/uppass" method="post" ref="${formPass}">
              <div class="form-field">
                <div class="form-field-cell">
                  <label class="form-field-input">
                    <input type="password" name="password" />
                    <span>旧密码</span>
                  </label>
                </div>
                <div class="form-field-info">
                  <div class="form-field-intro">请确保输入正确</div>
                  <div class="form-field-error"></div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <div class="form-field-cell">
                    <label class="form-field-input">
                      <input type="password" name="password1" />
                      <span>新密码</span>
                    </label>
                  </div>
                </div>
                <div class="form-field">
                  <div class="form-field-cell">
                    <label class="form-field-input">
                      <input type="password" name="password2" />
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
          </div>
        </div>
      </div>
    </div>`;
  }
}