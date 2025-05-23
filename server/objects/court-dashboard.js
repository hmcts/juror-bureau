const dataStore = require('../stores/court-dashboard');

;(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { extractDataAndHeadersFromResponse } = require('../lib/mod-utils');

  module.exports.dashboardNotifications = {
    get: function(req, locCode) {
      return dataStore.notifications;
    },
  }

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
