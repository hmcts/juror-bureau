;(function(){
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const utils = require('../lib/utils');

  module.exports.object = new DAO('bureau/staff', {
    get: function(staffLogin) {
      return {
        uri: staffLogin ? urljoin(this.resource, staffLogin) : this.resource,
        transform: utils.basicDataTransform,
      }
    },
    post: function(postBody) {
      return {
        uri: this.resource,
        body: postBody,
        transform: utils.basicDataTransform,
      }
    },
    put: function(staffLogin, putBody) {
      return {
        uri: urljoin(this.resource, staffLogin),
        body: putBody,
        transform: utils.basicDataTransform,
      }
    },
  });
})();
