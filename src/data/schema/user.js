/**
 * 用户
 */
import knex from '../knex.js';
import * as mdlFn from './util.js';

export const models = {
  User: {
    name: 'user',
    fields: {
      id: {type: 'increments'},
      username: {type: 'string', size: 50, null: false, unique: true},
      password: {type: 'string', size: 128, null: false},
      email: {type: 'string', size: 100, null: false, unique: true},
      verifiedAt: {type: 'timestamp', alias: 'verified_at'},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
      updatedAt: {type: 'timestamp', alias: 'updated_at', null: false, default: 'now'},
      lastLogin: {type: 'timestamp', alias: 'last_login'},
    },
    unique: []
  },
  UserInviteCode: {
    name: 'user_invite_code',
    fields: {
      id: {type: 'increments'},
      code: {type: 'string', size: 20, null: false, unique: true},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
    }
  },
  UserPassReset: {
    name: 'user_pass_reset',
    fields: {
      id: {type: 'increments'},
      uid: {type: 'integer', null: false, unique: true},
      code: {type: 'string', size: 10, null: false, unique: true},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
    }
  },
  UserMailVerify: {
    name: 'user_mail_verify',
    fields: {
      id: {type: 'increments'},
      uid: {type: 'integer', null: false, unique: true},
      code: {type: 'string', size: 10, null: false, unique: true},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
    }
  },
  UserBlackList: {
    name: 'user_black_list',
    fields: {
      id: {type: 'increments'},
      token: {type: 'string', size: 10, null: false, unique: true},
      expire: {type: 'timestamp', null: false},
      createdAt: {type: 'timestamp', alias: 'created_at', null: false, default: 'now'},
    }
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
  const model = models.User;

  // 用于登录过程
  mdl.getUserPass = mdlFn.modelToGetItem(model, field => {
    // 排除所有非 id 和 非 password 的字段
    return field === 'id' || field === 'password';
  }, {id: knex.raw('?')});
  mdl.getUserPassByUsername = mdlFn.modelToGetItem(model, field => {
    // 排除所有非 id 和 非 password 的字段
    return field === 'id' || field === 'password';
  }, {username: knex.raw('?')});

  // 用于注册过程
  mdl.getUserExistUsername = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, {username: knex.raw('?')});
  mdl.getUserExistEmail = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, {email: knex.raw('?')});

  mdl.getUserExistUsernameAndEmail = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, {username: knex.raw('@username'), email: knex.raw('@email')});

  // 用于个人中心信息，排除 password 字段
  mdl.getUserInfo = mdlFn.modelToGetItem(model, field => {
    // 排除 password 字段
    return field !== 'password';
  }, {id: knex.raw('?')});

  mdl.runInsertUserShort = mdlFn.modelToInsertItem(model, field => {
    return ['username', 'password', 'email'].includes(field) ? undefined : false;
  });

  // 更新用户最近登录
  mdl.runUpdateUserLastLogin = mdlFn.modelToUpdateItem(model, field => {
    return field === 'lastLogin' ? Math.round(Date.now() / 1000) : false;
  }, {id: knex.raw('?')});

  mdl.runUpdateUserEmailVerified = mdlFn.modelToUpdateItem(model, field => {
    return field === 'verifiedAt' ? Math.round(Date.now() / 1000) : false;
  }, {id: knex.raw('?')});

  mdl.runUpdateUserEmail = mdlFn.modelToUpdateItem(model, field => {
    return field === 'email' ? undefined :
      field === 'verifiedAt' ? null :
      field === 'updatedAt' ? knex.raw('(strftime(\'%s\',\'now\'))') :
      false;
  });

  mdl.runUpdateUserPassword = mdlFn.modelToUpdateItem(model, field => {
    return field === 'password' ? undefined :
      field === 'updatedAt' ? knex.raw('(strftime(\'%s\',\'now\'))') :
      false;
  });

  mdl.runUpdateUserName = mdlFn.modelToUpdateItem(model, field => {
    return field === 'username' ? undefined :
      field === 'updatedAt' ? knex.raw('(strftime(\'%s\',\'now\'))') :
      false;
  });


  // 检查一个用户是否是 root 用户
  mdl.getUserRoot = mdlFn.modelToGetItem(model, field => {
    return field === 'id';
  }, {id: 10000});
  // 将一个用户 ID 添加为 root 用户
  mdl.runInsertUserRoot = mdlFn.modelToInsertItem(model, field => {
    if (!['id', 'username', 'password', 'email'].includes(field)) {
      return false;
    }
  });
}





{
  const model = models.UserInviteCode;

  mdl.getUserInviteCodeByCode = mdlFn.modelToGetItem(model, undefined, {
    code: knex.raw('?')
  });

  mdl.runInsertUserInviteCodeShort = mdlFn.modelToInsertItem(model, field => {
    if (field === 'code') {
      return knex.raw('?');
    } else {
      return false;
    }
  });
}






{
  const model = models.UserPassReset;

  mdl.getUserPassResetByCode = mdlFn.modelToGetItem(model, undefined, {
    code: knex.raw('?')
  });

  mdl.runInsertUserPassResetShort = mdlFn.modelToInsertItem(model, field => {
    if (field === 'code' || field === 'uid') {
      return undefined;
    } else {
      return false;
    }
  });
}






{
  const model = models.UserMailVerify;

  mdl.getUserMailVerifyByCode = mdlFn.modelToGetItem(model, undefined, {
    code: knex.raw('?')
  });

  mdl.runInsertUserMailVerifyShort = mdlFn.modelToInsertItem(model, field => {
    if (field === 'code' || field === 'uid') {
      return undefined;
    } else {
      return false;
    }
  });
}






{
  const model = models.UserBlackList;

  mdl.getUserBlackListByToken = mdlFn.modelToGetItem(model, undefined, {
    token: knex.raw('?')
  });

  mdl.runInsertUserBlackListShort = mdlFn.modelToInsertItem(model, field => {
    if (!['token', 'expire'].includes(field)) {
      return false;
    }
  });

  mdl.runDeleteUserBlackListExpired = mdlFn.modelToDeleteItem(model, knex.raw('expire < strftime(\'%s\',\'now\')'));
}






// {
//   mdl.runInsertUserCasbinRoot = () => knex('user_casbin').insert({
//     id: knex.raw('@id'),
//     ptype: knex.raw('@ptype'),
//     v0: knex.raw('@v0'),
//     v1: knex.raw('@v1'),
//     v2: knex.raw('@v2'),
//     v3: knex.raw('@v3'),
//   }).toString();
// }




export default mdl;
