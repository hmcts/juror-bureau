
(() => {
  'use strict';

  const { getAttendanceDates, postAttendanceDates } = require('./yield-performance.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/yield-performance/dates',
      'reports.yield-performance.filter.dates.get',
      auth.verify,
      getAttendanceDates(app));
    app.post('/reporting/yield-performance/dates',
      'reports.yield-performance.filter.dates.post',
      auth.verify,
      postAttendanceDates(app));
  };
})();