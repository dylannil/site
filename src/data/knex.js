/**
 * 实例化 Knex 目前只支持 sqlite3
 */

import Knex from 'knex';

export default Knex({client: 'sqlite3', useNullAsDefault: true});
