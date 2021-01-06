
import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

chai.use(chaiAsPromised);

global.expect = expect;
global.sinon = sinon;

import './unit/index.js';
import './e2e/index.js';
