(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform } = require('../lib/utils');

  module.exports.erLocalAuthorityStatusDAO = new DAO('moj/er-dashboard/local-authority-status', {
    post: function(body) {
      return {
        uri: this.resource,
        transform: basicDataTransform,
        body,
      }
    }
  })

  module.exports.erUploadStats = new DAO('moj/er-dashboard/upload-stats')

  module.exports.localAuthoritiesDAO = new DAO('moj/er-dashboard/local-authorities')

})();
