/**
 * 404 页面
 */

import {Component} from '../../ane/index.js';

export default class NotFound extends Component {
  render() {
    const links = this.useRef()
    this.useLink(links, 'not_found');
    
    return `<main>
      <div class="page">
        <div class="article heti heti--classic">
          <h1 class="article__title">404</h1>
          <p>你访问的页面不存在</p>
          <p ref="${links}">
            <a class="nav-link" role="link" href="/">回到主页</a>
            <a class="nav-link" role="link" href="javascript:history.back()">回到上一页</a>
          </p>
        </div>
      </div>
    </main>`;
  }
}