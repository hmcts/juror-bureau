const _ = require('lodash');
const { replaceAllObjKeys } = require('../lib/mod-utils');
const { DAO } = require('./dataAccessObject');

module.exports.markAsUndeliverableDAO = new DAO('moj/undeliverable-response', {
  patch: (payload) => {
    return {
      uri: this.resource,
      body: replaceAllObjKeys(payload, _.snakeCase),
    };
  }
});