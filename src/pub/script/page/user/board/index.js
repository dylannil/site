/**
 * 用户中心
 * 
 * - 登录态
 * - 用户名、邮箱 更新
 * - 标签组：密码修改、用户管理、案例管理、文章管理、榜单管理
 */
import {Component, AneDOM} from '../../../ane/index.js';

import Self from './self.js';
import Case from './case.js';

export default class Board extends Component {
  dispose() {
    super.dispose();
    this.page && this.page.dispose();
  }
  render() {
    const {select, reduce} = this.useSession();
    const flag = select('flag');
    let ret;
    if (flag) {
      ret = select('logined');
    } else {
      ret = new Promise((resolve) => {
        const dispose = reduce('setUser', data => {
          dispose();
          const logined = select('logined');
          resolve(logined);
        });
      });
    }

    const logout = this.useRef();
    this.useLink(logout, 'logout');

    const tabs = [
      {key: 'self', name: '设置', comp: Self, auth: true},
      {key: 'case', name: '案例', comp: Case, auth: false}
    ];
    this.tab = tabs[0];
    this.page = new this.tab.comp();

    const loaderHandler = [];
    const loader0 = new Promise((resolve, reject) => loaderHandler.push({resolve, reject}));
    const loader1 = new Promise((resolve, reject) => loaderHandler.push({resolve, reject}));
    Promise.resolve(ret).then(logined => {
      // 未登录用户，不触发 ajax 请求
      if (!logined) {return ;} 
      // 已登录用户，及时加载用户信息
      const [a0, a1] = loaderHandler;
      this.ajax('user').then(a0.resolve, a0.reject);
      this.ajax('auth/board').then(res => {
        for (let i = 0, len = tabs.length; i < len; i++) {
          const tab = tabs[i];
          if (tab.key in res) {
            tab.auth = res[tab.key];
          }
        }
      }).then(a1.resolve, a1.reject);
    });

    const username = this.useRef();
    const email = this.useRef();
    const nav = this.useRef();
    const con = this.useRef();
    this.useEffect(() => {
      const domNav = this.ref(nav);
      const domCon = this.ref(con);
      if (!domNav || !domCon) {return ;}

      loader0.then(res => {
        const domUsername = this.ref(username);
        const domEmail = this.ref(email);
        domUsername && (domUsername.innerText = (res || {}).username);
        domEmail && (domEmail.innerText = (res || {}).email);
      });

      loader1.then(() => {
        domNav.innerHTML = '';
        for (let i = 0, len = tabs.length; i < len; i++) {
          const tab = tabs[i];
          if (tab.auth) {
            const domTab = document.createElement('div');
            domTab.className = `board-tab${tab === this.tab ? ' checked' : ''}`;
            domTab.setAttribute('key', tab.key);
            domTab.innerText = tab.name;
            domNav.appendChild(domTab);
            tab.dom = domTab;
          }
        }
      });

      const listener = e => {
        let tab = e.target;
        while(tab !== domNav && !tab.getAttribute('key')) {
          tab = tab.parentElement;
        }
        if (!tab) {return ;}
        // 
        const key = tab.getAttribute('key');
        if (this.tab.key === key) {return ;}
        // 
        tab = tabs.find(tab => tab.key === key);
        if (!tab) {return ;}
        // 
        this.tab.dom && this.tab.dom.classList.remove('checked');
        // 
        this.tab = tab;
        this.page && this.page.dispose();
        this.page = new this.tab.comp();
        // 
        this.tab.dom && this.tab.dom.classList.add('checked');
        AneDOM.renderIntoPart(this.page.render(), domCon);
      }

      domNav.addEventListener('click', listener);
      return () => {
        domNav.removeEventListener('click', listener);
      }
    }, [], 'board');

    return `<main>
      <div class="page">
        <div class="board" id="">
          <div class="board-head">
            <div class="board-grid">
              <div class="username" title="用户名" ref="${username}"></div>
              <div class="email" title="电子邮箱" ref="${email}"></div>
              <div class="logout">
                <a href="/user/logout" ref="${logout}">退出登录</a>
              </div>
            </div>
            <div class="board-tabs" ref="${nav}">
              <div class="board-tab checked" key="${this.tab.key}">${this.tab.name}</div>
            </div>
          </div>
          <div class="board-body" ref="${con}">
            ${this.page.render()}
          </div>
        </div>
      </div>
    </main>`;
  }
}