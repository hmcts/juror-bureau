const dataStore = require('../stores/court-dashboard');

;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { replaceAllObjKeys } = require('../lib/mod-utils');
  const _ = require('lodash');

  module.exports.dashboardNotifications = new DAO('moj/court-dashboard/notifications', {
    get: function(locCode) {
      return {
        uri: urljoin(this.resource, locCode),
        transform: (data) => { delete data['_headers']; return replaceAllObjKeys(data, _.camelCase) },
      };
    }
  })

  module.exports.dashboardAdminStats = new DAO('moj/court-dashboard/admin', {
    get: function(locCode) {
      return {
        uri: urljoin(this.resource, locCode),
        transform: (data) => { delete data['_headers']; return { ...replaceAllObjKeys(data, _.camelCase), ...dataStore.adminStats} },
      };
    }
  })

  module.exports.dashboardAttendanceStats = {
    get: function(req, locCode) {
      return dataStore.attendanceStats;
    }
  }

  module.exports.monthlyUtilisationStats = {
    get: function(req, locCode) {
      return dataStore.monthlyUtilisationStats;
    },
  }
  

})();
