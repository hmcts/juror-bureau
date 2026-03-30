;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.object = new DAO('bureau/staff/assign-multi', {
    post: function(assignTo, responses) {
      const body = {
        assignTo: (typeof assignTo === 'string' && assignTo.length > 0) ? assignTo : null,
        responses: responses,
      }

      return {
        uri: this.resource,
        body,
        transform: basicDataTransform
      }
    }
  });
})();
