/* eslint-disable strict */

const _ = require('lodash');
const { replaceAllObjKeys } = require('../lib/mod-utils');
const { basicDataTransform2 } = require('../lib/utils');
const { DAO } = require('./dataAccessObject');

module.exports.searchCoronerPoolsDAO = new DAO('moj/pool-search/coroner-pools', {
  post: function(payload) {
    return {
      uri: this.resource,
      body: replaceAllObjKeys(payload, _.snakeCase),
      transform: basicDataTransform2
    }
  }

});
