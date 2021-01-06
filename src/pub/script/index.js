/**
 * 入口文件
 */
import {AneDOM} from './ane/index.js';
import App from './app.js';
import logo from './logo.js';

// CSR 入口
if (typeof document !== 'undefined') {
  // 
  let theme = localStorage.getItem('theme');
  theme || (theme = window.matchMedia('prefers-color-scheme: dark').matches ? 'dark' : 'light');
  const fontsize = localStorage.getItem('fontsize') || 'fontsize-12';
  document.body.className = theme + ' ' + fontsize;
  // 
  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    document.removeEventListener('DOMContentLoaded', render);
    render();
  }
}
function render() {
  AneDOM.render(new App(), document.getElementById('root'));
  // 
  logo();
}

// SSR 入口
export function renderToString(location) {
  global.location = location;
  // 
  return AneDOM.renderToString(new App());
}
