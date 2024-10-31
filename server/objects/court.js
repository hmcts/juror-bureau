;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.object = new DAO('bureau/juror/court/catchment', {
    get: function(id) {
      return {
        uri: this.resource + id,
        transform: basicDataTransform,
      }
    }
  });
})();
