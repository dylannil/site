import knex from "../knex.js";

export function modelToExistsTable(model) {
  return () => knex.schema.hasTable(model.name).toString();
}
export function modelToCreateTable(model) {
  return () => knex.schema.createTable(model.name, t => {
    const {fields, unique} = model;
    for (let field in fields) {
      const {
        type,
        size,
        alias,
        null: nullable,
        unique,
        index,
        default: defaultValue,
      } = fields[field];
      const obj = t[type](alias || field, size);
      if (nullable === false) {
        obj.notNullable();
      }
      if (unique === true) {
        obj.unique();
      } else if (index === true) {
        obj.index();
      }
      if (defaultValue) {
        switch (type) {
          case 'timestamp':
            if (defaultValue === 'now') {
              obj.default(knex.raw(`(strftime('%s', 'now'))`))
            } else {
              obj.default(knex.fn[defaultValue]());
            }
            break;
          default:
            obj.default(defaultValue);
        }
      }
    }
    if (!unique) {return ;}
    for (let i = 0, len = unique.length; i < len; i++) {
      t.unique(unique[i]);
    }
  }).toString();
}


export function modelToGetItem({name, fields}, filter, whereClause) {
  return () => knex(name).select(Object.keys(fields).map(field => {
    if (filter && filter(field) === false) {
      return false;
    } else if (fields[field].alias) {
      return knex.ref(fields[field].alias).as(field);
    } else {
      return field;
    }
  }).filter(Boolean)).where(whereClause || {id: knex.raw('?')}).toString();
}

export function modelToAllList({name, fields}, filter) {
  return () => knex(name).select(Object.keys(fields).map(field => {
    if (filter && filter(field) === false) {
      return false;
    } else if (fields[field].alias) {
      return knex.ref(fields[field].alias).as(field);
    } else {
      return field;
    }
  }).filter(Boolean)).toString();
}

export function modelToNotEmpty(model) {
  return modelToAllList(model, field => field === 'id');
}

export function modelToInsertItem({name, fields}, regroup = field => (field === 'id' ? false : undefined)) {
  return () => knex(name).insert(Object.keys(fields).reduce((ret, field) => {
    const val = regroup(field);
    if (val !== false) {
      const key = fields[field].alias || field;
      ret[key] = val === undefined ? knex.raw(`@${field}`) : val;
    }
    return ret;
  }, {})).toString();
}

export function modelToUpdateItem({name, fields}, regroup = field => (field === 'id' ? false : undefined), where) {
  return () => knex(name).update(Object.keys(fields).reduce((ret, field) => {
    const val = regroup(field);
    if (val !== false) {
      const key = fields[field].alias || field;
      ret[key] = val === undefined ? knex.raw(`@${field}`) : val;
    }
    return ret;
  }, {})).where(where || {id: knex.raw(`@id`)}).toString();
}

export function modelToDeleteItem({name}, where) {
  return () => knex(name).where(where || {
    id: knex.raw(`?`)
  }).delete().toString();
}