/**
 * 使用 ajax 请求接口
 */

export function ajax(api, opts = {}) {
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {return ;}
    
    const {method = 'GET', data = null} = opts;
    
    const xhr = new XMLHttpRequest();
  
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) {return ;}

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else if (xhr.status >= 400 && xhr.status < 500) {
        try {
          reject(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('请求错误 ' + xhr.status));
      }
    }
  
    
    if (method === 'GET') {
      const query = data && Object.keys(data).reduce((ret, key) => {
        ret.push(key + '=' + encodeURIComponent(data[key]));
        return ret;
      }, []).join('&');
      xhr.open(method, `${location.origin}/api/${api}${query ? ('?' + query) : ''}`);
      xhr.send(null);
    } else {
      xhr.open(method, `${location.origin}/api/${api}`);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send(JSON.stringify(data));
    }
  });
}


export function upload(formdata, dist) {
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {return ;}
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('progress', function(e) {
      const done = e.position || e.loaded;
      const total = e.totalSize || e.total;
      console.log('上传进度: ' + (Math.floor(done/total*1000)/10) + '%');
    }, false);
    if ( xhr.upload ) {
      xhr.upload.onprogress = function(e) {
        const done = e.position || e.loaded
        const total = e.totalSize || e.total;
        console.log('上传进度: ' + done + ' / ' + total + ' = ' + (Math.floor(done/total*1000)/10) + '%');
      };
    }
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState !== 4) {return ;}

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else if (xhr.status >= 400 && xhr.status < 500) {
        try {
          reject(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('请求错误 ' + xhr.status));
      }
    };
    xhr.open('POST', `${location.origin}/api/file${dist ? '/' + dist : ''}`, true);
    xhr.send(formdata);
  });
}