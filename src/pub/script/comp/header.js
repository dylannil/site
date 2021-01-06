/**
 * 头部 - 标识、导航、控制
 */
import {Component} from '../ane/index.js';

export default class Header extends Component {
  session(refBtnLogin, refBtnBoard, refMenuLogin, refMenuBoard) {
    const {select, reduce} = this.useSession();

    let doms, wait;

    // 更新用户按钮和用户菜单的显示
    function updateUser({logined, username}) {
      if (!doms) {return ;}
      doms.btnLogin && doms.btnLogin.classList.toggle('hide', logined);
      doms.btnBoard && doms.btnBoard.classList.toggle('hide', !logined);
      doms.menuLogin && doms.menuLogin.classList.toggle('hide', logined);
      doms.menuBoard && doms.menuBoard.classList.toggle('hide', !logined);
      // 
      let anchor;
      if (doms.btnBoard && (anchor = doms.btnBoard.getElementsByTagName('A')[0])) {
        anchor.innerText = logined && username || '';
      }
      if (doms.menuBoard && (anchor = doms.menuBoard.getElementsByTagName('A')[0])) {
        anchor.innerText = '用户：' + (logined && username || '');
      }
    }

    const dispose = reduce('setUser', () => {
      const data = {
        logined: select('logined'),
        username: select('username')
      };
      if (doms) {
        updateUser(data);
      } else {
        wait = data;
      }
    });

    this.useEffect(() => {
      doms = {
        btnLogin: this.ref(refBtnLogin),
        btnBoard: this.ref(refBtnBoard),
        menuLogin: this.ref(refMenuLogin),
        menuBoard: this.ref(refMenuBoard)
      };

      wait && updateUser(wait);

      return dispose;
    }, [], 'session');

    return {
      logined: select('logined'),
      username: select('username')
    };
  }
  render() {
    // 标志点击回到主页
    const home = this.useRef();
    this.useLink(home, 'home');

    // 字体大小切换
    const fontsize = this.useRef();

    // 主题色按钮
    const theme = this.useRef();
    this.useEffect(() => {
      const domTheme = this.ref(theme);
      if (!domTheme) {return ;}

      const listener = () => {
        let theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        theme = theme === 'dark' ? 'light' : 'dark';
        document.body.className = theme;
        localStorage.setItem('theme', theme);
      }

      domTheme.addEventListener('click', listener);
      return () => {
        domTheme.removeEventListener('click', listener);
      };
    }, [], 'theme');

    // 导航栏内链接点击执行页内跳转
    const nav = this.useRef();
    this.useLink(nav, 'nav');

    // 头部导航栏按滚动自动折叠
    const header = this.useRef();
    this.useEffect(() => {
      const domHeader = this.ref(header);
      if (!domHeader) {return ;}

      let offset = window.pageYOffset;
      const listener = () => {
        const oy = window.pageYOffset;
        domHeader.classList.toggle('folded', oy > 44 && oy > offset);
        offset = oy;
      }

      window.addEventListener('scroll', listener);
      return () => {
        window.removeEventListener('scroll', listener);
      }
    }, [], 'header');

    // 用户按钮
    const btnLogin = this.useRef();
    const btnBoard = this.useRef();
    const menuLogin = this.useRef();
    const menuBoard = this.useRef();
    this.useLink(btnLogin, 'login');
    this.useLink(btnBoard, 'board');
    const sess = this.session(btnLogin, btnBoard, menuLogin, menuBoard);
    
    return `<header class="site-header${location.pathname.startsWith('/user/') ? (' hide') : ''}" ref="${header}">
      <a class="site-brand" title="回到主页" href="/" ref="${home}">
        <svg class="site-brand-logo" xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'>
          <path fill='#000318' d="M928,1024H96c-53,0-96-43-96-96V96C0,43,43,0,96,0h832c53,0,96,43,96,96v832
            C1024,981,981,1024,928,1024z M524.8,93.1c-113.5,0-205.5,68.5-205.5,153s92,153,205.5,153s205.5-68.5,205.5-153
            S638.3,93.1,524.8,93.1z M255.4,424.8C170.7,424.8,102,534,102,668.7s68.7,243.9,153.4,243.9s153.4-109.2,153.4-243.9
            S340.1,424.8,255.4,424.8z M596.2,600.1c-65.6,142.3-52.1,288.4,30.1,326.3s202-46.8,267.6-189.2s52.1-288.4-30.1-326.3
            S661.8,457.7,596.2,600.1z"/>
        </svg>
        <span class="site-brand-name">YearnIO</span>
      </a>
      <div class="site-header-btn fontsize hide" ref="${fontsize}">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <path d="M64 512l384 0 0 128-128 0 0 384-128 0 0-384-128 0zM960 256l-251.744 0 0 768-136.512 0 0-768-251.744 0 0-128 640 0z" />
        </svg>
      </div>
      <div class="site-header-btn theme hide" ref="${theme}">
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
          <path d="M8 16A8 8 90 0 1 8 0A8 8 90 0 1 8 16z M8 15A7 7 -90 1 0 8 1z" />
        </svg>
      </div>
      <nav class="site-header-nav nav" ref="${nav}">
        <a href="/">首页</a>
        <a href="/case">案例</a>
      </nav>
      <div class="site-header-btn user">
        <div class="btn${sess.logined ? ' hide' : ''}" ref="${btnLogin}">
          <a href="/user/login">登录</a>
        </div>
        <div class="btn${sess.logined ? '' : ' hide'}" ref="${btnBoard}">
          <a href="/user">${sess.username || ''}</a>
        </div>
      </div>
      ${this.renderMenu(sess, menuLogin, menuBoard)}
    </header>`;
  }
  renderMenu(sess, menuLogin, menuBoard) {
    // 菜单点击，展开或折叠弹出菜单
    const menu = this.useRef();
    this.useEffect(() => {
      const domMenu = this.ref(menu);
      if (!domMenu) {return ;}
      const listener = e => {
        if (e.target.classList.contains('menu-icon')) {
          const ret = domMenu.classList.toggle('unfold');
          if (ret) {
            domMenu.listener = e => {
              e.stopPropagation();
              domMenu.classList.remove('unfold');
              window.removeEventListener('click', domMenu.listener);
              delete domMenu.listener;
            }
            window.addEventListener('click', domMenu.listener);
            e.stopPropagation(); // 避免立即执行上述 click 响应
          } else if (domMenu.listener) {
            domMenu.listener(e);
          }
        }
      }
      domMenu.addEventListener('click', listener);
      return () => {
        domMenu.removeEventListener('click', listener);
      };
    }, [], 'menu_click');

    const menuView = this.useRef();
    this.useLink(menuView, 'menu');
    this.useEffect(() => {
      const domView = this.ref(menuView);
      if (!domView) {return ;}

      const listener = e => {
        const target = e.target;
        if (target.name === 'theme') {
          const theme = target.value;
          document.body.classList.remove('light', 'dark');
          document.body.classList.add(theme);
          localStorage.setItem('theme', theme);
        } else if (target.name === 'fontsize') {
          const fontsize = target.value;
          document.body.classList.remove('fontsize-12', 'fontsize-18', 'fontsize-24');
          document.body.classList.add(fontsize);
          localStorage.setItem('fontsize', fontsize);
        }
      }

      domView.addEventListener('change', listener);
      return () => {
        domView.removeEventListener('change', listener);
      };
    }, [], 'menu_view');

    return `<div class="site-header-btn menu" ref="${menu}">
      <div class="menu-icon"></div>
      <div class="menu-view" ref="${menuView}">
        <div class="menu-view-line hide">
          文字
          <ul class="menu-view-line-list">
            <li><input type="radio" value="fontsize-24" name="fontsize" id="font-24"><label for="font-24">大</label></li>
            <li><input type="radio" value="fontsize-18" name="fontsize" id="font-18"><label for="font-18">中</label></li>
            <li><input type="radio" value="fontsize-12" name="fontsize" id="font-12"><label for="font-12">小</label></li>
          </ul>
        </div>
        <div class="menu-view-line hide">
          主题
          <ul class="menu-view-line-list panel-list--icon">
            <li><input type="radio" value="light" name="theme" id="theme-light"><label for="theme-light">🌞</label></li>
            <li><input type="radio" value="dark" name="theme" id="theme-dark"><label for="theme-dark">🌙</label></li>
          </ul>
        </div>
        <div class="menu-view-sep hide"></div>
        <div class="menu-view-line">
          <a href="/">首页</a>
        </div>
        <div class="menu-view-line">
          <a href="/case">案例</a>
        </div>
        <div class="menu-view-sep"></div>
        <div class="menu-view-line${sess.logined ? ' hide' : ''}" ref="${menuLogin}">
          <a href="/user/login">登录</a>
        </div>
        <div class="menu-view-line${sess.logined ? '' : ' hide'}" ref="${menuBoard}">
          <a href="/user">用户：${sess.username || ''}</a>
        </div>
      </div>
    </div>`;
  }
}
