/**
 * 案例展示 - 所有案例的描述和图片预览
 */

import {AneDOM, Component} from '../../ane/index.js';
import {formatDate} from '../../util/format.js';
import Preview from '../../comp/preview.js';

let cases;

export default class Case extends Component {
  loadList() {
    return this.ajax('case').then(res => {
      cases = res;
    });
    // TODO 服务端渲染
    // if (typeof SSR !== 'undefined') {
    //   return SSR.svc('case.getAllCases', `<% __PLACE_HOLDER__.forEach(function(case) { %>
    //     ${this.renderItem({
    //       link: '<%= case.link%>',
    //       title: '<%= case.title%>',
    //       desc: '<%= case.desc%>',
    //       createdAtHuman: '<%= case.createdAtHuman%>',
    //       updatedAtHuman: '<%= case.updatedAtHuman%>'
    //     })}
    //   <% }); %>`);
    // }

    // // 请求接口，待返回后，更新列表显示
    // this.ajax('post').then(ret => {
    //   refreshPostMap(ret);
    //   this.playList(null);
    // }).catch(err => {
    //   this.playList(err);
    // });

    // // 保持不变
    // const domUl = document.getElementById('postList');
    // return domUl ? domUl.innerHTML : '';
  }
  preview(id) {
    id = parseInt(id);
    const item = cases.find(c => c.id === id);
    if (!item || !item.img) {return ;}
    // 
    if (!this.previewInst) {
      this.previewInst || (this.previewInst = new Preview());
      if (!this.domPreview || this.domPreview.previousElementSibling !== this.domMasonry) {
        this.domPreview = document.createElement('div');
        this.domMasonry.parentElement.appendChild(this.domPreview);
      }
      AneDOM.renderIntoPart(this.previewInst.render(), this.domPreview);
    }
    // 
    this.previewInst.show({
      src: `${location.origin}/file/case/${item.img}`,
      title: item.name,
      description: item.desc
    });
  }
  dispose() {
    super.dispose();

    if (this.previewInst) {
      this.previewInst.dispose();
      this.previewInst = undefined;
      if (this.domPreview) {
        this.domPreview.parentElement && this.domPreview.parentElement.removeChild(this.domPreview);
        this.domPreview = null;
      }
    }
  }
  render() {
    const loader = this.loadList();
    
    const masonry = this.useRef();
    this.useEffect(() => {
      const domMasonry = this.ref(masonry);
      if (!domMasonry) {return ;}
      this.domMasonry = domMasonry;

      let cols;

      const play = () => {
        let n;
        if (window.innerWidth >= 992) {
          n = 3;
        } else if (window.innerWidth >= 576) {
          n = 2;
        } else {
          n = 1;
        }
        if (n && n !== cols) {
          cols = n;
        } else {
          return ;
        }
        
        domMasonry.innerHTML = '';

        const lanes = Array.from(Array(cols)).map(it => {
          const lane = document.createElement('div');
          lane.className = 'masonry-lane';
          domMasonry.appendChild(lane);
          return lane;
        });
  
        cases.sort((a, b) => {
          const aStamp = a.updatedAt || a.createdAt;
          const bStamp = b.updatedAt || b.createdAt;
          return aStamp > bStamp ? -1 : aStamp < bStamp ? 1 : 0;
        }).map((item, i) => {
          const tile = this.renderTile(item);

          let lane = lanes.reduce((ref, lane) => {
            if (!ref || ref.clientHeight > lane.clientHeight) {
              return lane;
            } else {
              return ref;
            }
          }, null);
          lane && lane.appendChild(tile);
          
          return tile;
        });
      }
      loader.then(() => play());

      // 通过 touch 触发的 click 需要双击打开图片预览
      // 单击一次，激活 hover
      // 桌面 mouse 触发的 click 一次即可打开图片预览
      let ev;
      const isFromTouch = e => {
        if (e.sourceCapabilities) {
          return e.sourceCapabilities.firesTouchEvents
        } else if (ev) {
          return ev.touches[0].clientX === e.clientX &&
            ev.touches[0].clientY === e.clientY &&
            ev.stamp > Date.now() - 100;
        } else {
          return false;
        }
      }
      const ontouch = e => {
        if (e.sourceCapabilities) {return ;}
        ev = e;
        ev.stamp = Date.now();
      }

      let stamp;
      const listener = e => {
        let tile = e.target;
        while (tile !== domMasonry) {
          if (tile.classList.contains('masonry-tile')) {
            break;
          }
          tile = tile.parentElement;
        }
        if (!tile || !tile.classList.contains('masonry-tile')) {
          return ;
        }
        const fromTouch = isFromTouch(e);
        if (fromTouch && (!stamp || stamp < Date.now() - 300)) {
          stamp = Date.now();
          return;
        } else {
          stamp = null;
          this.preview(tile.getAttribute('cid'));
        }
      }

      window.addEventListener('resize', play, false);
      domMasonry.addEventListener('click', listener);
      domMasonry.addEventListener('touchstart', ontouch);
      return () => {
        window.removeEventListener('resize', play, false);
        domMasonry.removeEventListener('click', listener);
        domMasonry.removeEventListener('touchstart', ontouch);

        this.domMasonry = null;
      };
    }, [], 'case');
    return `<main>
      <div class="page wide">
        <div class="masonry" ref="${masonry}"></div>
      </div>
    </main>`;
  }
  renderTile(item) {
    const tile = document.createElement('div');
    tile.className = 'masonry-tile';
    tile.setAttribute('cid', item.id);
    tile.innerHTML = `
      <div class="masonry-tile-back">
        <img src="/file/case/${item.img}" />
        <div class="masonry-tile-mask">
          <div class="masonry-tile-type">${item.type}</div>
        </div>
      </div>
      ${!item.able ? '<div class="masonry-tile-priv" title="待公布案例"></div>' : ''}
      <div class="masonry-tile-info">
        <div class="masonry-tile-head">
          ${item.link ? `<a target="_blank" href="${item.link}"></a>` : ''}
        </div>
        <h2>${item.name}</h2>
        <p>${item.desc}</p>
        <div class="masonry-tile-foot">
          <div class="masonry-tile-word">${(item.word || '').split(',').map(w => w.trim() ? `<span>${w.trim()}</span>` : '').join('')}</div>
          <div title="创建于：${formatDate(item.createdAt)}">${formatDate(item.updatedAt || item.createdAt)}</div>
        </div>
      </div>
    `;
    return tile;
  }
}