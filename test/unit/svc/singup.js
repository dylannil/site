/**
 * 注册
 */

const Knex = require('knex');
const Sqlite = require('better-sqlite3');
const { expect } = require('chai');

module.exports = () => describe('面向所有访客', () => {
  it('注册', async () => {
    // 邀请码表
    // 用户表
    // 域表
    expect({a: 1, b: 2}).to.eql({a: 1, b: 3});
  });
  it('登录', async () => {
    // const knex = Knex({client: 'sqlite3', useNullAsDefault: true});
    // const sql = knex.schema.hasTable('user').toQuery();
    // // console.log(sql);
    // const db = new Sqlite(':memory:', {timeout: 60000});
    // const ret = db.prepare(sql).get();
    // // console.log(ret);

    // const sqlCreate = knex.schema.createTableIfNotExists('user', (table) => {
    //   table.increments();
    //   table.string('username').notNullable().unique();
    //   table.string('password').notNullable();
    //   table.string('email').notNullable().unique();
    //   // table.timestamps(true, true);
    //   table.timestamp('created_at', {precision: 6}).notNullable().defaultTo(knex.raw(`(strftime('%s','now'))`));
    //   table.timestamp('updated_at', {precision: 6}).notNullable().defaultTo(knex.raw(`(strftime('%s','now'))`));
    //   table.timestamp('last_login', {precision: 6});
    // })
    // .toString();
    // db.exec(sqlCreate);

    // // console.log(db.prepare(sql).get());

    // db.prepare('INSERT OR IGNORE INTO user (id, username, password) VALUES (?, ?, ?)').run(10000, 'nil', '123456');

    // const ret1 = db.prepare('SELECT * FROM user').get();
    // // console.log(ret1);
    
  });
  it('密码重置', async () => {});
  // it('注册，需要提供用户名，密码，邀请码', () => {});
  // it('注册，用户名长度不得小于 6 个字符，不得长于 25 个字符', () => {});
  // it('注册，密码统一长度为 64 个字符', () => {});
  // it('注册，邀请码需要在', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
  // it('注册', () => {});
});