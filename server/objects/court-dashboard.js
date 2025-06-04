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

  module.exports.attendanceStats = {
    get: function(req, locCode, period) {
      if (period === 'today') {
        return dataStore.attendanceStatsToday;
      } else if (period === 'last7days') {
        return dataStore.attendanceStatsLast7Days;
      } else if (period === 'next7days') {
        return dataStore.attendanceStatsNext7Days;
      } else {
        throw new Error('Invalid period specified');
      }
    },
  }

  module.exports.unconfirmedAttendances = {
    get: function(req, locCode) {
      return dataStore.unconfirmedAttendances;
    },
  }

  module.exports.monthlyUtilisationStats = {
    get: function(req, locCode) {
      return dataStore.monthlyUtilisationStats;
    },
  }

  module.exports.unpaidAttendances = {
    get: function(req, locCode) {
      return dataStore.unpaidAttendances;
    },
  }
  

})();
