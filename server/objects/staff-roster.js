;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const utils = require('../lib/utils');

  module.exports.object = new DAO('bureau/staff/roster', {
    get: function(){
      return {
        uri: this.resource,
        transform: utils.basicDataTransform,
      };
    }
  });

})();
