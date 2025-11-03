;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const _ = require('lodash');

  module.exports.bureauDashboardDAO = new DAO('moj/bureau-dashboard', {
    get: function(section) {
      return {
        uri: urljoin(this.resource, section),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase) },
      };
    }
  })

  module.exports.bureauDashboardPoolsUnderResponded = new DAO('moj/bureau-dashboard/pools-under-responded', {
     get: function(params) {
      return {
        uri: urljoin(this.resource, params),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase) },
      };
    }
  })

})();
