/**
 * 
 * 
 * - 登录态
 * - 用户名、邮箱 更新
 * - 标签组：密码修改、用户管理、案例管理、文章管理、榜单管理
 */
import {AneDOM, Component} from '../../../ane/index.js';
import {formatDate} from '../../../util/format.js';
import Preview from '../../../comp/preview.js';

// 独立加载和更新
let cases = [];

export default class CaseMng extends Component {
  preview(id) {
    id = parseInt(id);
    const item = cases.find(c => c.id === id);
    if (!item || !item.img) {return ;}
    // 
    if (!this.previewInst) {
      this.previewInst || (this.previewInst = new Preview());
      if (!this.pnlPreview || this.pnlPreview.parentElement !== this.pnlEdit.parentElement) {
        this.pnlPreview = document.createElement('div');
        this.pnlEdit.parentElement.appendChild(this.pnlPreview);
      }
      AneDOM.renderIntoPart(this.previewInst.render(), this.pnlPreview);
    }
    // 
    this.previewInst.show({
      src: `${location.origin}/file/case/${item.img}`,
      title: item.name,
      description: item.desc
    });
  }
  loadList() {
    return this.ajax('case').then(res => {
      cases = res;
    });
  }
  // 渲染列表
  async playList() {
    // if (!this.table) {return ;}
    // const body = this.table;

    await this.loadList();

    this.renderTable();
  }
  // 显示并填充数据
  playItemInEdit(item = {}) {
    if (!this.form) {return ;}
    const form = this.form;
    // 引用当前编辑的对象
    form.item = item;
    // 标题
    form.previousElementSibling.innerText = item.id ? '更新案例信息' : '新建案例';
    // 将被编辑数据显示到表单
    for (let i = 0, len = form.length; i < len; i++) {
      const input = form[i];
      if (input.name === 'img') {
        const empty = !item.img;
        input.parentElement.parentElement.parentElement.classList.toggle('nonempty', !empty);
        const preview = input.previousElementSibling;
        if (empty) {
          preview.innerHTML = '';
        } else {
          let img = preview.getElementsByTagName('IMG')[0];
          if (!img) {
            img = document.createElement('IMG');
            preview.appendChild(img);
          }
          img.src = '/file/case/' + item.img;
        }
      } else if (input.name) {
        input.value = item[input.name] || '';
        if (input.parentElement.classList.contains('form-field-input')) {
          const empty = !input.value.trim();
          input.parentElement.parentElement.parentElement.classList.toggle('nonempty', !empty);
        }
      }
    }
  }
  toggleItemAble(item) {
    this.ajax('case/able', {
      method: 'post',
      data: {id: item.id}
    }).then(res => {
      item.able = res.able;
      this.renderTable();
    });
  }
  deleteItem(item) {
    this.ajax('case', {
      method: 'delete',
      data: {id: item.id}
    }).then(() => {
      let i = cases.length;
      while (i--) {
        if (cases[i] === item) {
          cases.splice(i, 1);
        }
      }
      this.renderTable();
    });
  }
  dispose() {
    super.dispose();

    if (this.previewInst) {
      this.previewInst.dispose();
      this.previewInst = undefined;
      if (this.pnlPreview) {
        this.pnlPreview.parentElement && this.pnlPreview.parentElement.removeChild(this.pnlPreview);
        this.pnlPreview = null;
      }
    }
  }
  render() {
    const form = this.useRef();
    const create = this.useRef();
    const cancel = this.useRef();
    const table = this.useRef();

    // 渲染完成后，绑定按钮和表格操作
    this.useEffect(() => {
      const btnCreate = this.ref(create);
      const btnCancel = this.ref(cancel);
      if (!btnCreate || !btnCancel) {return console.error('按钮 引用失败');}

      const domForm = this.ref(form);
      const domTable = this.ref(table);
      if (!domForm || !domTable) {return console.error('表单 或 表格 引用失败');}

      this.table = domTable;
      this.form = domForm;
      const pnlEdit = this.pnlEdit = domForm.parentElement.parentElement;

      // 渲染加载的所有案例
      this.playList();

      const listener0 = () => {
        this.playItemInEdit();
        pnlEdit.classList.add('visible');
      };
      const listener1 = () => {
        pnlEdit.classList.remove('visible');
      };
      const listener2 = e => {
        let target = e.target;
        let role;
        while (target !== domTable) {
          role || (role = target.getAttribute('role'));
          if (target.tagName === 'TR') {break;}
          target = target.parentElement;
        }
        if (target.tagName !== 'TR' || !role) {return ;}
        // 
        const cid = parseInt(target.getAttribute('cid'));
        const item = cases.find(({id}) => id === cid);
        if (!item) {return ;}
        // 
        switch (role) {
          case 'edit':
            this.playItemInEdit(item);
            pnlEdit.classList.add('visible');
            break;
          case 'toggle':
            this.toggleItemAble(item);
            break;
          case 'delete':
            if (window.confirm('您确定要删除此案例吗？')) {
              this.deleteItem(item);
            }
            break;
          case 'img':
            if (item.img) {
              this.preview(item.id);
            }
            break;
          case 'link':
            if (item.link) {
              window.open(item.link, '_blank');
            }
            break;
        }
      };

      const listener3 = e => {
        if (e.target === pnlEdit) {
          pnlEdit.classList.remove('visible');
        }
      }
      const listener4 = e => {
        e.preventDefault(); // 禁止主页面滚动
      }

      btnCreate.addEventListener('click', listener0);
      btnCancel.addEventListener('click', listener1);
      domTable.addEventListener('click', listener2);
      pnlEdit.addEventListener('click', listener3);
      pnlEdit.addEventListener('wheel', listener4);
      return () => {
        btnCreate.removeEventListener('click', listener0);
        btnCancel.removeEventListener('click', listener1);
        domTable.removeEventListener('click', listener2);
        pnlEdit.removeEventListener('click', listener3);
        pnlEdit.removeEventListener('wheel', listener4);
        // 
        this.table = null;
        this.pnlEdit = null;
        this.form = null;
      };
    }, [], 'case');

    // 激活标签交互
    this.useForm(form, {
      submit: async (e, hint) => {
        const form = e.target;
        let flag;

        const name = form.name.value.trim();
        flag = hint('name', !name ? '案例名称不可为空' :
          name.length < 4 ? '案例名称至少需要 4 个字符' :
          name.length > 50 ? '案例名称最多可容纳 15 个字符' :
          !form.id.value && cases.find((c) => c.name === name) ? '案例名称已经存在，请选择其他名称新建' :
          -1) || flag;

        if (flag) {return ;}

        try {
          // 先上传图片
          let img;
          if (form.img.value && form.img.files.length) {
            // 上传图片
            const formdata = new FormData();
            formdata.append('img', form.img.files[0]);
            const list = await this.upload(formdata, 'case');
            ({file: img} = list.find(({name}) => name === 'img'));
          } else {
            // 复用图片 页面没有做修改
            img = form.item.img;
          }
          // 后保存案例
          const data = Array.from(form).reduce((ret, input) => {
            if (input.name === 'img') {
              img && (ret.img = img);
            } else if (input.name) {
              const val = input.value.trim();
              val && (ret[input.name] = val);
            };
            return ret;
          }, {});
          const ret = await this.ajax('case', {method: 'POST', data});
          if (data.id) {
            for (let key in ret) {
              form.item[key] = ret[key];
            }
          } else {
            for (let key in ret) {
              data[key] = ret[key];
            }
            cases.push(data);
          }
          this.renderTable();
          // 关闭
          this.pnlEdit && this.pnlEdit.classList.remove('visible');
        } catch (e) {
          switch (e.code) {
            default:
              hint(e.message);
          }
        }
      }
    });

    return `<div class="board-case">
      <div class="board-case-edit model" id="boardCase">
        <div class="model-box">
          <h3>新建或更新案例</h3>
          <form class="board-case-form" action="/api/case" method="post" ref="${form}">
            <input type="hidden" name="id" />
            <div class="form-row">
              <div class="form-field" style="flex-grow: 3;">
                <div class="form-field-cell">
                  <label class="form-field-input">
                    <input type="text" name="name" />
                    <span>案例名(必填)</span>
                  </label>
                </div>
              </div>
              <div class="form-field">
                <div class="form-field-cell">
                  <label class="form-field-input">
                    <input type="text" name="type" />
                    <span>类型</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="form-field">
              <div class="form-field-cell">
                <label class="form-field-input">
                  <textarea name="desc" ></textarea>
                  <span>简介</span>
                </label>
              </div>
            </div>
            <div class="form-field">
              <div class="form-field-cell">
                <label class="form-field-input">
                  <input type="text" name="link" />
                  <span>链接</span>
                </label>
              </div>
            </div>
            <div class="form-field">
              <div class="form-field-cell">
                <label class="form-field-input">
                  <div class="form-field-preview"></div>
                  <input type="file" name="img" accept="image/jpg, image/jpeg, image/png" />
                  <span>图片</span>
                </label>
              </div>
              <div class="form-field-info">
                <div class="form-field-intro">点击打开本地图片</div>
              </div>
            </div>
            <div class="form-field">
              <div class="form-field-cell">
                <label class="form-field-input">
                  <input type="text" name="word" />
                  <span>关键字</span>
                </label>
              </div>
              <div class="form-field-info">
                <div class="form-field-intro">作为关键字，多个请以 “，” 隔开，空字符会被忽略</div>
              </div>
            </div>
            <div class="form-end">
              <div class="form-end-cell">
                <input type="submit" class="form-submit" value="保存" />
                <input type="button" class="form-cancel" value="取消" ref="${cancel}" />
              </div>
            </div>
          </form>
        </div>
      </div>
      <div class="board-case-show">
        <div class="board-case-create">
          <div class="btn" ref="${create}">新建</div>
          <p>在这里管理所有要展示的案例数据</p>
        </div>
        <table class="board-case-table">
          <thead>
            <tr>
              <th colspan="1" rowspan="2">序号</th>
              <th colspan="9">信息</th>
              <th colspan="2" rowspan="2">操作</th>
            </tr>
            <tr>
              <th colspan="9">简介</th>
            </tr>
          </thead>
          <tbody ref="${table}"></tbody>
        </table>
      </div>
    </div>`;
  }
  renderTable() {
    if (!this.table) {return ;}
    const html = cases.sort((a, b) => {
      const aStamp = a.updatedAt || a.createdAt;
      const bStamp = b.updatedAt || b.createdAt;
      return aStamp > bStamp ? -1 : aStamp < bStamp ? 1 : 0;
    }).map((item, i) => {
      return `
        <tr cid="${item.id}">
          <td colspan="1" rowspan="2">${i + 1}</td>
          <td colspan="9">
            <div class="board-case-info">
              ${item.name}
              <span role="img" class="${item.img ? 'nonempty' : ''}" title="图片${item.img || ''}"></span>
              <span role="link" class="${item.link ? 'nonempty' : ''}" title="链接${item.link || ''}"></span>
              <span>${formatDate(item.updatedAt || item.createdAt)}</span>
            </div>
          </td>
          <td colspan="2" rowspan="2">
            <div class="board-case-ctrl">
              <span role="toggle" class="${item.able ? 'nonempty' : ''}" title="切换公开状态"></span>
              <span role="edit" title="编辑"></span>
              <span role="delete" title="删除"></span>
            </div>
          </td>
        </tr>
        <tr cid="${item.id}">
          <td colspan="9">
            <div class="board-case-info">
              ${item.desc}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    AneDOM.renderIntoPart(html, this.table);
  }
}