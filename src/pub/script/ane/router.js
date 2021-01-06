/**
 * 路由相关操作
 */
import matchPath from './match_path.js';
import {render} from './dom.js';
import {getRootInst} from './inst.js';

// 多层路由，记录最近匹配到的路径
let prefix = '';

function rerender() {
  prefix = ''; // 每次重新渲染，需要重置 prefix

  const app = getRootInst();
  render(app);
}

// 响应浏览器导航操作
typeof window !== 'undefined' &&
window.addEventListener('popstate', rerender);

export function navTo(url, flag) {
  if (url === location.pathname) {return ;}
  // 更新 location
  if (!flag) {
    window.history.pushState({}, null, url);
  } else {
    window.history.replaceState({}, null, url);
  }
  // 重新渲染
  rerender();
}

// 装饰 Component 上，帮助组件管理内置的路由表
export function route(list) {
  // 更新路由表
  const routes = this._routes || [];
  this._routes = list.map(it => {
    it.prefix = prefix;
    it.path = prefix.replace(/\/$/, '') + it.path;
    
    const index = routes.findIndex(r => {
      return r.path === it.path &&
        r.exact === it.exact &&
        r.comp === it.comp;
    });
    if (index >= 0) {
      const route = routes[index];
      it.comp = route.comp;
      it.page = route.page;
      it.active = route.active;
      // 
      routes.splice(index, 1);
    }
    return it;
  });
  // 切换路由，匹配到首个后，后续不做匹配只重置
  let matched;
  for (let i = 0; i < this._routes.length; i++) {
    const route = this._routes[i];
    if (!matched) {
      matched = matchPath(location.pathname || '/', route);
      if (matched) {
        prefix = route.path;
        matched.route = route;
        route.active = true;
      } else {
        route.active = false;
      }
    } else {
      route.active = false;
    }
  }
  // 激活路由
  if (matched) {
    const route = matched.route;
    if (!route.page) {
      route.page = new route.comp(matched);
    } else {
      route.page.props = matched;
    }
    return route;
  } else {
    return null;
  }
}

// 装饰 Component 用于响应 click 执行跳转
export function useLink(ref, deps, key) {
  if (Object.prototype.toString.call(deps) === '[object String]') {
    key = deps;
    deps = undefined;
  }
  this.useEffect(() => {
    const dom = this.ref(ref);
    if (!dom) {return ;}
  
    const listener = e => {
      let target = e.target;
      let href;
      while (true) {
        href = target.getAttribute('href') || target.href && target.href.replace(location.origin, '');
        if (href || target === dom) {break;}
        target = target.parentElement;
      }
      if (!href) {return ;}
      // a 标签特殊操作
      if (target.tagName === 'A') {
        if (target.target === '_blank' || href.startsWith('javascript:')) {
          return ;
        } else {
          // 避免 a 触发页面跳转
          e.preventDefault();
        }
      }
      // 跳转
      navTo(href);
    }
  
    dom.addEventListener('click', listener);
    return () => {
      dom.removeEventListener('click', listener);
    };
  }, deps || [], key ? ('link_' + key) : 'link');
}