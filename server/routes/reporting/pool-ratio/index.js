
(() => {
  'use strict';

  const { getAttendanceDates, postAttendanceDates } = require('./pool-ratio.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/pool-ratio/dates',
      'reports.pool-ratio.filter.dates.get',
      auth.verify,
      getAttendanceDates(app));
    app.post('/reporting/pool-ratio/dates',
      'reports.pool-ratio.filter.dates.post',
      auth.verify,
      postAttendanceDates(app));
  };
})();
