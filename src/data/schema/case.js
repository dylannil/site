/**
 * 案例
 */
import knex from '../knex.js';
import * as mdlFn from './util.js';

export const models = {
  Case: {
    name: 'case',
    fields: {
      id: {type: 'increments'},
      name: {type: 'string', size: 50, unique: true},
      type: {type: 'string', size: 25, index: true},
      desc: {type: 'string', size: 200},
      word: {type: 'string', size: 50},
      link: {type: 'string', size: 200},
      img: {type: 'string', size: 16},
      able: {type: 'boolean'},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
      updatedAt: {type: 'timestamp', alias: 'updated_at', null: false, default: 'now'}
    },
    unique: []
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
  const model = models.Case;

  mdl.getCaseByName = mdlFn.modelToGetItem(model, field => {
    return true;
  }, {name: knex.raw('?')});

  mdl.runInsertCaseShort = mdlFn.modelToInsertItem(model, field => {
    if (['id', 'able', 'createdAt', 'updatedAt'].includes(field)) {
      return false;
    }
  });
  mdl.runUpdateCaseShort = mdlFn.modelToUpdateItem(model, field => {
    if (['id', 'able', 'createdAt'].includes(field)) {
      return false;
    } else if (field === 'updatedAt') {
      return knex.raw(`(strftime(\'%s\',\'now\'))`);
    }
  });
  mdl.runUpdateCaseAble = mdlFn.modelToUpdateItem(model, field => {
    if (field === 'able') {
      return undefined;
    } else if (field === 'updatedAt') {
      return knex.raw(`(strftime(\'%s\',\'now\'))`);
    } else {
      return false;
    }
  });
}

export default mdl;
