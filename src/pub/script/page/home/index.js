/**
 * 主页 - 模板 变量 函数
 */

import {Component} from '../../ane/index.js';

export default class Home extends Component {
  render() {
    const link = this.useRef();
    this.useLink(link, 'link');

    return `<main>
      <div class="page">
        <div class="home-banner site">
          <div class="site-hello">
            欢迎来到 <span>YearnIO</span>。这里有一些<span>技术经验</span>、<span>工作技巧</span>，是一个小小的<span>交流</span>平台。
          </div>
          <div class="site-short">
            <span>开发者</span>一名
            <div class="site-short-greet hide">打招呼</div>
          </div>
        </div>
      </div>
    </main>`;
  }
}