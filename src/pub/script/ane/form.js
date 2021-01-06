/**
 * 路由相关操作
 */

// 装饰 Component 用于响应 click 执行跳转
export function useForm(ref, deps, key, opts) {
  switch (Object.prototype.toString.call(deps).slice(8, -1)) {
    case 'Array':
      if (Object.prototype.toString.call(key).slice(8, -1) === 'Object') {
        opts = key;
        key = undefined;
      }    
      break;
    case 'String':
      opts = key;
      key = deps;
      deps = undefined;
      break;
    case 'Object':
      opts = deps;
      deps = undefined;
      key = undefined;
  }
  opts || (opts = {});

  this.useEffect(() => {
    const domForm = this.ref(ref);
    if (!domForm) {return ;}

    const disposables = [];

    // 通用响应
    const onfocus = e => {
      e.target.parentElement.parentElement.parentElement.classList.add('focus');
    };
    const onblur = e => {
      e.target.parentElement.parentElement.parentElement.classList.remove('focus');
    };
    const oninput = e => {
      const field = e.target.parentElement.parentElement.parentElement;
      field.classList.toggle('nonempty', !!e.target.value.trim().length);
    }
    const onchange = e => {
      const field = e.target.parentElement.parentElement.parentElement;
      field.classList.toggle('nonempty', !!e.target.value.trim().length);
      // 
      if (e.target.type === 'file') {
        const input = e.target;
        const preview = input.previousElementSibling;
        let img = preview.getElementsByTagName('IMG')[0];
        if (input.files.length) {
          const reader = new FileReader();
          reader.onload = e => {
            if (!img) {
              img = document.createElement('IMG');
              preview.appendChild(img);
            }
            img.src = e.target.result;
          }
          reader.readAsDataURL(input.files[0]);
        } else {
          img && img.parentElement.removeChild(img);
        }
      }
    }
    for (let i = 0, len = domForm.length; i < len; i++) {
      const input = domForm[i];
      if (input.type === 'submit') {
      } else if (input.type === 'radio') {
      } else if (input.type === 'checkbox') {
      } else if (input.type === 'file') {
        input.addEventListener('change', onchange);
        disposables.push(() => {
          input.removeEventListener('change', onchange);
        });
      } else {
        input.addEventListener('focus', onfocus);
        input.addEventListener('blur', onblur);
        input.addEventListener('input', oninput);
        disposables.push(() => {
          input.removeEventListener('focus', onfocus);
          input.removeEventListener('blur', onblur);
          input.removeEventListener('input', oninput);
        });
      }
    }

    // 提交操作
    const listener = e => {
      e.preventDefault();
      if (!opts.submit) {return ;}

      opts.submit(e, (name, text) => {
        if (text == null) {
          text = name;
          const input = Array.from(e.target).find(input => input.type === 'submit');
          if (!input) {return text !== -1;}
          if (text !== -1) {
            const cell = input.parentElement;
            cell.parentElement.classList.add('error');

            let info = cell.nextElementSibling;
            if (info && !info.classList.contains('form-end-info')) {
              info = undefined;
            }
            if (!info) {
              info = document.createElement('div');
              info.className = 'form-end-info';
              if (cell.nextElementSibling) {
                cell.parentElement.insertBefore(info, cell.nextElementSibling);
              } else {
                cell.parentElement.appendChild(info);
              }
            }

            let error = info.lastElementChild;
            if (error && !error.classList.contains('form-end-error')) {
              error = undefined;
            }
            if (!error) {
              error = document.createElement('div');
              error.className = 'form-end-error';
              info.appendChild(error);
            }
            if (text) {
              error.innerText = text;
            } else {
              info.removeChild(error);
            }
            
            return true;
          } else {
            input.parentElement.parentElement.parentElement.classList.remove('error');
            return false;
          }
        }
        // 字段错误
        const input = e.target[name];
        if (text !== -1) {
          // 提示错误
          const cell = input.parentElement.parentElement;

          cell.parentElement.classList.add('error');

          let info = cell.nextElementSibling;
          if (info && !info.classList.contains('form-field-info')) {
            info = undefined;
          }
          if (!info) {
            info = document.createElement('div');
            info.className = 'form-field-info';
            if (cell.nextElementSibling) {
              cell.parentElement.insertBefore(info, cell.nextElementSibling);
            } else {
              cell.parentElement.appendChild(info);
            }
          }

          let error = info.lastElementChild;
          if (error && !error.classList.contains('form-field-error')) {
            error = undefined;
          }
          if (!error) {
            error = document.createElement('div');
            error.className = 'form-field-error';
            info.appendChild(error);
          }
          if (text) {
            error.innerText = text;
          } else {
            info.removeChild(error);
          }
          return true;
        } else {
          // 关闭错误
          input.parentElement.parentElement.parentElement.classList.remove('error');
          return false;
        }
      });
    };
    domForm.addEventListener('submit', listener);
    disposables.push(() => {
      domForm.removeEventListener('submit', listener);
    });

    return () => disposables.forEach(fn => fn());
  }, deps || [], key ? ('form_' + key) : 'form');
}