(() => {
  'use strict';

  const { getAttendanceDates, postAttendanceDates } = require('./sitting-days.controller.js');
  const auth = require('../../../components/auth');
  const { isSuperUser } = require('../../../components/auth/user-type.js');

  module.exports = function(app) {
    app.get('/reporting/sitting-days/dates',
      'reports.sitting-days.filter.dates.get',
      auth.verify,
      isSuperUser,
      getAttendanceDates(app));
    app.post('/reporting/sitting-days/dates',
      'reports.sitting-days.filter.dates.post',
      auth.verify,
      isSuperUser,
      postAttendanceDates(app));
  };
})();