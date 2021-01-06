
import boot from './boot/index.js';
import route from './route/index.js';

export default () => describe('web', () => {
  boot();
  route();
});