/**
 * 链接别名 - 用以锁定
 */


const alias = {
  '/': '/index',
  '/user': '/user/index'
};

export default function(pathname) {
  return alias[pathname] || pathname;
}