/**
 * 图片预览
 */
import {Component} from '../ane/index.js';

export default class Preview extends Component {
  show(data) {
    if (!data.src) {return ;}
    this.reset();
    this.data = data;
    this.domPreview && this.domPreview.classList.remove('hidden');
    this.renderView();
    this.renderInfo();
    this.reset();
  }
  reset() {
    if (!this.domView || !this.domInfo) {return ;}
    this.ow = 0;
    this.oh = 0;
    this.os = 1;
    this.ts = 1;
    this.tx = 0;
    this.ty = 0;
    this.domView.style.transform = '';
    if (this.domImg) {
      this.domImg.removeAttribute('width');
      this.domImg.removeAttribute('height');
      this.domImg.onload = e => {
        this.ow = this.domImg.width;
        this.oh = this.domImg.height;
        this.os = Math.min(
          this.ow > (window.innerWidth - 24) ? ((window.innerWidth - 24) / this.ow) : 1,
          this.oh > (window.innerHeight - 24) ? ((window.innerHeight - 24) / this.oh) : 1
        );
        this.domImg.width = this.ow * this.os * this.ts;
      }
    }
  }
  zoom({tx, ty, ox, oy, os, d} = {}) {
    if (!this.domImg) {return ;}
    if (d != null) {
      let ts;
      if (d === 100 || d === -100 || d === 0) {
        // 滚轮缩放
        const ss = [.1, .125, .2, .25, .4, .5, .75, 1, 1.1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
        let i = ss.findIndex((s) => s >= this.ts);
        if (i === -1) {
          i = ss.length - 1;
        } else {
          i += d > 0 ? 1 : d < 0 ? -1 : 0;
          i = i < 0 ? 0 : i >= ss.length ? ss.length - 1 : i;
        }
        ts = ss[i];
      } else {
        // 手势缩放
        ts = os * d;
        ts = ts < .1 ? .1 : ts > 10 ? 10 : ts;
      }
      const f = ts / this.ts;
      // 缩放
      this.ts = ts;
      this.domImg.width = this.ow * this.os * this.ts;
      // 平移
      const dx = (ox - window.innerWidth / 2 - tx) * (1 - f);
      const dy = (oy - window.innerHeight / 2 - ty) * (1 - f);
      this.tx += dx;
      this.ty += dy;
      this.domView.style.transform = `translate(${this.tx}px, ${this.ty}px)`;
    } else {
      // 缩放
      this.ts = 1;
      this.domImg.width = this.ow * this.os * this.ts;
      // 平移
      this.tx = 0
      this.ty = 0;
      this.domView.style.transform = '';
    }
  }
  move({tx, ty, dx, dy} = {}) {
    if (!this.domView) {return ;}
    if (tx != null && ty != null && dx != null && dy != null) {
      this.tx = tx + dx;
      this.ty = ty + dy;
      this.domView.style.transform = `translate(${this.tx}px, ${this.ty}px)`;
    } else {
      this.domView.style.transform = '';
    }
  }
  render() {
    const view = this.useRef();
    const info = this.useRef();
    const hide = this.useRef();

    this.useEffect(() => {
      const domView = this.ref(view);
      const domInfo = this.ref(info);
      const domHide = this.ref(hide);
      if (!domView || !domInfo || !domHide) {return ;}

      const domPreview = domView.parentElement;
      this.domPreview = domPreview;

      this.domView = domView;
      this.domInfo = domInfo;

      this.renderView();
      this.renderInfo();
      this.reset();

      let flag, ox, oy, tx, ty, os, clicked;

      const listener = e => {
        switch (e.type) {
          case 'wheel': // 缩放
            e.preventDefault(); // 避免主界面的滚动
            tx = this.tx;
            ty = this.ty;
            ox = e.clientX;
            oy = e.clientY;
            this.zoom({tx, ty, ox, oy, d: e.deltaY > 0 ? -100 : e.deltaY < 0 ? 100 : 0});
            break;
          case 'mousedown':
            flag = true;
            tx = this.tx;
            ty = this.ty;
            ox = e.clientX;
            oy = e.clientY;
            break;
          case 'mousemove':
            if (flag) {
              e.preventDefault(); // 避免原生拖拽操作
              flag = 1; // 
              const dx = e.clientX - ox;
              const dy = e.clientY - oy;
              this.move({tx, ty, dx, dy});
            }
            break;
          case 'mouseup':
            flag = false;
            break;
          case 'touchstart':
            flag = true;
            tx = this.tx;
            ty = this.ty;
            os = this.ts;
            ox = Array.from(e.touches).map(t => t.clientX);
            oy = Array.from(e.touches).map(t => t.clientY);
            break;
          case 'touchmove':
            if (flag) {
              e.preventDefault();
              if (e.touches.length === 2) {
                // 缩放
                const d0 = Math.sqrt((ox[1] - ox[0])**2, (oy[1] - oy[0])**2);
                const x0 = e.touches[0].clientX;
                const y0 = e.touches[0].clientY;
                const x1 = e.touches[1].clientX;
                const y1 = e.touches[1].clientY;
                const d1 = Math.sqrt((x1 - x0)**2, (y1 - y0)**2);
                
                this.zoom({tx, ty, ox: ox[0], oy: oy[0], os, d: d1 / d0});
              } else {
                // 平移
                const dx = e.touches[0].clientX - ox[0];
                const dy = e.touches[0].clientY - oy[0];
                this.move({tx, ty, dx, dy});
              }
            }
            break;
          case 'touchend':
            flag = false;
            break;
          case 'click':
            const now = Date.now();
            if (!clicked || now > clicked + 300) {
              clicked = now;
            } else {
              clicked = null;
              this.zoom();
            }
            break;
          case 'dblclick':
            // this.zoom();
            break;
        }
      };

      const close = e => {
        e.preventDefault();
        domPreview.classList.add('hidden');
      }

      domPreview.addEventListener('wheel', listener);
      domPreview.addEventListener('mousedown', listener);
      domPreview.addEventListener('mousemove', listener);
      domPreview.addEventListener('mouseup', listener);
      domPreview.addEventListener('touchstart', listener);
      domPreview.addEventListener('touchmove', listener);
      domPreview.addEventListener('touchend', listener);
      domPreview.addEventListener('click', listener);
      domPreview.addEventListener('dblclick', listener);

      domHide.addEventListener('click', close);

      return () => {
        domPreview.removeEventListener('wheel', listener);
        domPreview.removeEventListener('mousedown', listener);
        domPreview.removeEventListener('mousemove', listener);
        domPreview.removeEventListener('mouseup', listener);
        domPreview.removeEventListener('touchstart', listener);
        domPreview.removeEventListener('touchmove', listener);
        domPreview.removeEventListener('touchend', listener);
        domPreview.removeEventListener('click', listener);
        domPreview.removeEventListener('dblclick', listener);

        domHide.removeEventListener('click', close);
  
        this.domPreview = null;
        this.domView = null;
        this.domInfo = null;
      };
    })

    return `<div class="site-preview">
      <div class="site-preview-mask"></div>
      <div class="site-preview-view" ref="${view}"></div>
      <div class="site-preview-info" ref="${info}">
        <h2></h2>
        <p></p>
      </div>
      <div class="site-preview-hide" ref="${hide}"></div>
    </div>`;
  }
  renderView() {
    if (!this.domView || !this.data) {return ;}
    let img = this.domView.getElementsByTagName('IMG')[0];
    if (!img) {
      img = document.createElement('IMG');
      this.domView.appendChild(img);
    }
    this.domImg = img;
    img.src = this.data.src;
  }
  renderInfo() {
    if (!this.domInfo || !this.data) {return ;}
    let h2 = this.domInfo.getElementsByTagName('H2')[0];
    let p = this.domInfo.getElementsByTagName('p')[0];
    if (!p) {
      p = document.createElement('p');
      this.domInfo.appendChild(p);
    }
    if (!h2) {
      h2 = document.createElement('h2');
      this.domInfo.insertBefore(p, h2);
    }
    h2.innerText = this.data.title;
    p.innerText = this.data.description;
  }
}