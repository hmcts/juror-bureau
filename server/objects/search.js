;(function(){
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const { basicDataTransform2 } = require('../lib/utils');

  module.exports.searchResponsesDAO = new DAO('moj/juror-response/retrieve', {
    post: (payload) => {
      return {
        uri: 'moj/juror-response/retrieve',
        body: replaceAllObjKeys(payload, _.snakeCase),
        transform: basicDataTransform2,
      };
    }
  });

})();
