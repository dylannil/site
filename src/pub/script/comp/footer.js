/**
 * 尾部
 */
import {Component} from '../ane/index.js';

export default class footer extends Component {
  render() {
    const list = this.useRef();
    this.useLink(list, 'list');
    
    return `<footer class="site-footer${location.pathname.startsWith('/user/') ? ' hide' : ''}">
      <ul class="site-footer-list" ref="${list}">
        <li>© ${new Date().getFullYear()} YearnIO, Pers.</li>
        <li><a href="/case">案例</a></li>
        <li class="hide"><a href="/rank">榜单</a></li>
        <li><a href="/about">关于</a></li>
      </ul>
    </footer>`;
  }
}