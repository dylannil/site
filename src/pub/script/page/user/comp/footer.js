/**
 * 用户界面 页尾
 */

import { Component } from "../../../ane/index.js";

export default class UserFooter extends Component {
  render() {
    const links = this.useRef();
    this.useLink(links, 'indie_footer');
    
    return `<div class="indie-footer">
      <div class="indie-footer-intro">© 2020 YearnIO, Pers.</div>
      <ul class="indie-footer-links" ref="${links}">
        <li class="indie-footer-link">
          <a href="/">主页</a>
        </li>
        <li class="indie-footer-link">
          <a href="/about">关于</a>
        </li>
      </ul>
    </div>`;
  }
}