(() => {
  'use strict';

  const _ = require('lodash');
  const urljoin = require('url-join');
  const { DAO } = require('./dataAccessObject');
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.managementDashboardDAO = new DAO('moj/management-dashboard', {
    get: function(section) {
      return {
        uri: urljoin(this.resource, section),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase) },
      };
    }
  })

})();
