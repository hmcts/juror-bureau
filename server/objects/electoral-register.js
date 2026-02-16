(function() {
  'use strict';

  const _ = require('lodash')
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.erLocalAuthorityStatusDAO = new DAO('moj/er-dashboard/local-authority-status', {
    post: function(body) {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
        body,
      }
    }
  })

  module.exports.erUploadStats = new DAO('moj/er-dashboard/upload-stats')

  module.exports.localAuthoritiesDAO = new DAO('moj/er-dashboard/local-authorities', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  })

})();
