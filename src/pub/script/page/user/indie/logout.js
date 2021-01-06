/**
 * 退出登录
 */

import {Component} from '../../../ane/index.js';

export default class UserLogout extends Component {
  render() {
    const {dispatch} = this.useSession();
    this.ajax('user/logout').then(res => {
      if (this.showLogout) {
        this.showLogout();
      } else {
        this.showLogoutWait = true;
      }
      // 
      dispatch('setUser', null);
    });

    const info = this.useRef();
    this.useEffect(() => {
      const domInfo = this.ref(info);
      if (!domInfo) {return ;}
      this.showLogout = () => domInfo.innerText = '您已经成功退出登录';
      if (this.showLogoutWait) {
        this.showLogout();
        delete this.showLogoutWait;
      }
      return () => delete this.showLogout;
    });
    
    return `<div class="indie-main form">
      <h1 class="indie-main-title">退出登录</h1>
      <div class="indie-main-desc">退出登录后仍可作为普通访客访问网站</div>
      <p class="indie-main-part" ref="${info}">退出登录...</p>
    </div>`;
  }
}