
const testEnforcer = require('./enforcer');
const testAdapter = require('./adapter');
const testCasbin = require('./casbin');

module.exports = () => describe('认证', () => {
  testEnforcer();
  testAdapter();
  testCasbin();
});