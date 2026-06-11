;(function(){
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const { mapSnakeToCamel } = require('../lib/mod-utils');

  module.exports.searchResponsesDAO = new DAO('moj/juror-response/retrieve', {
    post: (payload) => {
      return {
        uri: 'moj/juror-response/retrieve',
        body: replaceAllObjKeys(payload, _.snakeCase),
        transform: (response) => {
          delete response._headers;
          return mapSnakeToCamel(response);
        },
      };
    }
  });

})();
