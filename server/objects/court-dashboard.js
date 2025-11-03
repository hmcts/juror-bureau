;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const _ = require('lodash');

  module.exports.courtDashboardDAO = new DAO('moj/court-dashboard', {
    get: function(section, locCode) {
      return {
        uri: urljoin(this.resource, section, locCode),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase) },
      };
    }
  })

  module.exports.dashboardAdminStats = new DAO('moj/court-dashboard/admin', {
    get: function(locCode) {
      return {
        uri: urljoin(this.resource, locCode),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase) },
      };
    }
  })

  module.exports.dashboardAttendanceStats = new DAO('moj/court-dashboard/attendance', {
     get: function(locCode) {
      return {
        uri: urljoin(this.resource, locCode),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase) },
      };
    }
  })

})();
