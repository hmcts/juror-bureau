/* eslint-disable strict */

const { replaceAllObjKeys } = require('../lib/mod-utils');
const { basicDataTransform2 } = require('../lib/utils');
const { DAO } = require('./dataAccessObject')
const _ = require('lodash');

module.exports.confirmIdentityDAO = new DAO('moj/juror-record/confirm-identity', {
  patch: (payload) => {
    return {
      uri: this.resource,
      body: replaceAllObjKeys(payload, _.snakeCase),
      transform: basicDataTransform2
    };
  }
});
