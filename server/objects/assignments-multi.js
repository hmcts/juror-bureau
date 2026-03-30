;(function(){
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils')
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.object = new DAO('bureau/staff/assignments-multi', {
    post: function(jurorNumbers) {
      return {
        uri: this.resource,
        body: replaceAllObjKeys({
          jurorNumbers,
        }, _.snakeCase),
        transform: basicDataTransform2
      }
    }
  });
})();
