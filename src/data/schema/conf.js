/**
 * 配置
 * 
 * 参考 casbin 的 PERM 模型，实现对各种不同类型配置的统一存储
 * 使用模型，定义后续多个字段的实际意义
 * 所有字段都使用 string 类型存储
 * 
 * - 标签颜色，每种标签可以设置一个颜色供后续使用
 */
import knex from '../knex.js';
import * as mdlFn from './util.js';

export const models = {
  Conf: {
    name: 'conf',
    fields: {
      id: {type: 'increments'},
      type: {type: 'string', size: 20, null: false, index: true},
      v0: {type: 'string', size: 20, null: false},
      v1: {type: 'string', size: 20},
      v2: {type: 'string', size: 20},
      v3: {type: 'string', size: 20},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
      updatedAt: {type: 'timestamp', alias: 'updated_at', null: false, default: 'now'},
    },
    unique: [
      ['type', 'v0', 'v1', 'v2', 'v3']
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
  const model = models.Conf;

  mdl.allConfByType =
  mdl.getConfByType = mdlFn.modelToGetItem(model, field => {
    if (['createdAt', 'updatedAt'].includes(field)) {
      return false;
    }
  }, {type: knex.raw('?')});

  mdl.getConfByShort1 = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, b => b.where({
    type: knex.raw('@type'),
    v0: knex.raw('@v0')
  }).whereNull('v1')
    .whereNull('v2')
    .whereNull('v3'));
  mdl.getConfByShort2 = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, b => b.where({
    type: knex.raw('@type'),
    v0: knex.raw('@v0'),
    v1: knex.raw('@v1')
  }).whereNull('v2')
    .whereNull('v3'));
  mdl.getConfByShort3 = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, b => b.where({
    type: knex.raw('@type'),
    v0: knex.raw('@v0'),
    v1: knex.raw('@v1'),
    v2: knex.raw('@v2')
  }).whereNull('v3'));
  mdl.getConfByShort4 = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, {
    type: knex.raw('@type'),
    v0: knex.raw('@v0'),
    v1: knex.raw('@v1'),
    v2: knex.raw('@v2'),
    v3: knex.raw('@v3')
  });

  mdl.runInsertConfShort = mdlFn.modelToInsertItem(model, field => {
    if (['id', 'createdAt', 'updatedAt'].includes(field)) {
      return false;
    }
  });
  mdl.runUpdateConfShort = mdlFn.modelToUpdateItem(model, field => {
    if (['createdAt'].includes(field)) {
      return false;
    } else if (field === 'updatedAt') {
      return knex.raw(`(strftime(\'%s\',\'now\'))`);
    }
  });
}

export default mdl;
