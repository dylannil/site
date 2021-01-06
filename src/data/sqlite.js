/**
 * 连接 sqlite 数据库
 */
import path from 'path';
import fs from 'fs';
import sqlite from 'better-sqlite3';

let db;

export default function(opts = {}) {
  if (db) {return db;}

  if (opts.dbFile) {
    fs.mkdirSync(path.dirname(opts.dbFile), {recursive: true});
  }

  return sqlite(opts.dbFile || ':memory:', {});
}