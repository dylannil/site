/**
 * 会话管理
 * 
 * - 登录成功 填充 user 字段
 * - 登出成功 清理 user 字段
 * - 页面启动 首刷 user 信息
 * - 会话超时 重刷 user 信息
 * 
 * 采用订阅者模式，自动更新依赖会话状态的功能的行为，不限定更改次数，
 * 每次更新，都需要立即反应到相关的功能块
 */

const session = {
  flag: false, // 是否完成初始化
  user: null,
};

const listeners = {};

function select(key) {
  switch (key) {
    case 'flag':
      return session.flag;
    case 'currUser':
      return session.user;
    case 'logined':
      return !!(session.user || {}).id;
    case 'username':
      return (session.user || {}).username;
  }
}

function dispatch(key, val) {
  let data;
  switch (key) {
    case 'setUser':
      session.flag = true;
      session.user = val;
      data = session.user;
      break;
  }
  (listeners[key] || []).forEach(cb => {
    cb(data);
  });
}

function reduce(key, cb) {
  const list = listeners[key] || (listeners[key] = []);
  list.push(cb);
  return () => {
    let i = list.length;
    while (i--) {
      if (list[i] === cb) {
        list.splice(i, 1);
      }
    }
  };
}

export function useSession() {
  return {dispatch, select, reduce};
}
