/**
 * 权限
 */
import knex from '../knex.js';
import * as mdlFn from './util.js';

export const models = {
  Auth: {
    name: 'auth',
    fields: {
      id: {type: 'increments'},
      ptype: {type: 'string', size: 2, null: false},
      v0: {type: 'string', size: 20, null: false},
      v1: {type: 'string', size: 20, null: false},
      v2: {type: 'string', size: 20},
      v3: {type: 'string', size: 20},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
    },
    unique: [
      ['ptype', 'v0', 'v1', 'v2', 'v3']
    ]
  }
}

const mdl = {};

for (let modelName in models) {
  const model = models[modelName];
  mdl[`sqlExistsTable${modelName}`] = mdlFn.modelToExistsTable(model);
  mdl[`sqlCreateTable${modelName}`] = mdlFn.modelToCreateTable(model);
  mdl[`iterate${modelName}`] =
  mdl[`all${modelName}`] = mdlFn.modelToAllList(model);
  mdl[`get${modelName}`] = mdlFn.modelToGetItem(model);
  mdl[`get${modelName}NotEmpty`] = mdlFn.modelToNotEmpty(model);
  mdl[`runInsert${modelName}`] = mdlFn.modelToInsertItem(model);
  mdl[`runUpdate${modelName}`] = mdlFn.modelToUpdateItem(model);
  mdl[`runDelete${modelName}`] = mdlFn.modelToDeleteItem(model);
}

{
  const model = models.Auth;

  mdl.runInsertAuthShort = mdlFn.modelToInsertItem(model, field => {
    if (['id', 'createdAt'].includes(field)) {
      return false;
    }
  });

  // 检查一个用户是否是 root 用户
  mdl.getAuthRoot = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, {
    ptype: 'g2',
    v0: 10000,
    v1: 'root',
    v2: null,
    v3: null
  });
  // 将一个用户 ID 添加为 root 用户
  mdl.runInsertAuthRoot = mdlFn.modelToInsertItem(model, field => {
    if (field === 'id') {
      return 10000;
    } else if (field === 'ptype') {
      return 'g2';
    } else if (field === 'v1') {
      return 'root';
    } else if (field === 'v0') {
      return 10000;
    } else {
      return false;
    }
  });
}

export default mdl;
