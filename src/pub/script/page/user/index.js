/**
 * 用户相关自由页面
 */

import {Component} from '../../ane/index.js';

import Header from './comp/header.js';
import Footer from './comp/footer.js';

import UserLogin from './indie/login.js';
import UserLogout from './indie/logout.js';
import UserSignup from './indie/signup.js';
import UserUnpass from './indie/unpass.js';
import UserRnpass from './indie/rnpass.js';
import UserRnmail from './indie/rnmail.js';

import UserBoard from './board/index.js';

import NotFound from '../base/notfound.js';

export default class UserFree extends Component {
  session() {
    const {select, reduce} = this.useSession();

    const nav = () => {
      // 部分页面不自动跳转
      if (['logout', 'rnmail', 'rnpass'].includes(location.pathname.slice(6))) {
        return ;
      }
      // 其他页面按登录与否自动跳转
      const logined = select('logined');
      if (logined) {
        if (location.pathname !== '/user') {
          this.navTo('/user', true);
        }
      } else {
        if (location.pathname === '/user') {
          this.navTo('/user/login', true);
        }
      }
    };
    
    select('flag') && nav();
    const dispose = reduce('setUser', nav);
    this.useEffect(() => dispose, [], 'user');
  }
  dispose() {
    super.dispose();
    // 
    this.header && this.header.dispose();
    this.footer && this.footer.dispose();
    this.page && this.page.dispose();
  }
  render() {
    this.session();
    
    const header = this.header || (this.header = new Header());
    const footer = this.footer || (this.footer = new Footer());

    // 路由到合适的页面
    const {page} = this.route([
      {path: '/login', exact: true, comp: UserLogin},
      {path: '/logout', exact: true, comp: UserLogout},
      {path: '/signup', exact: true, comp: UserSignup},
      {path: '/unpass', exact: true, comp: UserUnpass},
      {path: '/rnpass', exact: true, comp: UserRnpass},
      {path: '/rnmail', exact: true, comp: UserRnmail},
      {path: '/', exact: true, comp: UserBoard},
      {path: '', comp: NotFound}
    ]);
    if (this.page !== page) {
      if (this.page) {
        this.page.dispose();
      }
      this.page = page;
    }

    if (page instanceof UserBoard || page instanceof NotFound) {
      return page.render();
    } else {
      return `<main>
        <div class="indie">
          <div class="indie-box">
            ${header.render()}
            ${page.render()}
            ${footer.render()}
          </div>
        </div>
      </main>`;
    }
  }
}
