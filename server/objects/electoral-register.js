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
        body: replaceAllObjKeys(body, _.snakeCase),
      }
    }
  });

  module.exports.erUploadStats = new DAO('moj/er-dashboard/upload-stats', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });

  module.exports.localAuthoritiesDAO = new DAO('moj/er-dashboard/local-authorities', {
    get: function() {
      return {
        uri: this.resource,
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });

  module.exports.localAuthorityInfoDAO = new DAO('moj/er-dashboard/local-authority-info/{laCode}', {
    get: function(laCode) {
      return {
        uri: this.resource.replace('{laCode}', laCode),
        transform: (data) => replaceAllObjKeys(basicDataTransform(data), _.camelCase),
      }
    }
  });

})();
