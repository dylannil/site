/**
 * 前端核心页面功能
 * 
 * - 支持前后端同构
 * - 将一个个抽象组件根据 router 组合起来成为一个组件树
 * - 遍历组件树，渲染出 DOM 或 String，自动填充数据和绑定事件
 * - 针对 DOM 自动后需要自动绑定事件
 * 
 */

import {Component} from './ane/index.js';

import Header from './comp/header.js';
import Footer from './comp/footer.js';

import Home from './page/home/index.js';
import User from './page/user/index.js';
import Case from './page/case/index.js';
import About from './page/base/about.js';
import NotFound from './page/base/notfound.js';

export default class App extends Component {
  session() {
    const {dispatch, reduce} = this.useSession();
    // 
    reduce('setUser', user => {
      this._sessionTimer && clearTimeout(this._sessionTimer);
      if (user && user.exp) {
        this._sessionTimer = setTimeout(() => {
          this._sessionTimer = null;
          // 登录成功、登出成功、会话超时，自动重新检查会话是否重签
          // 触发时间点在超时之后，从而避免自动重签
          this.session();
        }, user.exp * 1000 - Date.now());
      }
    });
    // 
    this.ajax('user/identity').then(res => {
      dispatch('setUser', res || null);
    }).catch(e => {
      console.error(e);
      dispatch('setUser', null);
    });
  }
  dispose() {
    super.dispose();
    // 
    this.header && this.header.dispose();
    this.footer && this.footer.dispose();
    this.page && this.page.dispose();
  }
  render() {
    if (!this._sessionLoaded) {
      this._sessionLoaded = true;
      // 页面打开或刷新时触发一次
      this.session();
    }
    
    const header = this.header || (this.header = new Header());
    const footer = this.footer || (this.footer = new Footer());

    // 路由到合适的页面
    const {page} = this.route([
      {path: '/', exact: true, comp: Home},
      
      {path: '/user', comp: User},
      {path: '/case', exact: true, comp: Case},

      {path: '/about', exact: true, comp: About},

      {path: '', comp: NotFound}
    ]);
    if (this.page !== page) {
      if (this.page) {
        this.page.dispose();
      }
      this.page = page;
    }

    return `<div id="root">
      ${header.render()}
      ${page.render()}
      ${footer.render()}
    </div>`;
  }
}
