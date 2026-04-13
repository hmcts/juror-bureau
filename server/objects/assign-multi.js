;(function(){
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils');
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.object = new DAO('bureau/staff/assign-multi', {
    post: function(assignTo, responses) {
      const body = replaceAllObjKeys({
        assignTo: (typeof assignTo === 'string' && assignTo.length > 0) ? assignTo : null,
        responses: responses,
      }, _.snakeCase);

      return {
        uri: this.resource,
        body,
        transform: basicDataTransform2
      }
    }
  });
})();
