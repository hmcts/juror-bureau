;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.postponeObject = new DAO('moj/deferral-maintenance/juror/postpone', {
    post: function(payload) {
      return {
        uri: this.resource,
        body: payload,
        transform: basicDataTransform,
      }
    }
  });

})();
