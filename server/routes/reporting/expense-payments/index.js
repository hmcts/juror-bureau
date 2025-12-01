(() => {
  'use strict';

  const { getAttendanceDates, postAttendanceDates } = require('./expense-payments.controller.js');
  const auth = require('../../../components/auth');
  const { isSuperUser } = require('../../../components/auth/user-type.js');

  module.exports = function(app) {
    app.get('/reporting/expense-payments/dates',
      'reports.expense-payments.filter.dates.get',
      auth.verify,
      isSuperUser,
      getAttendanceDates(app));
    app.post('/reporting/expense-payments/dates',
      'reports.expense-payments.filter.dates.post',
      auth.verify,
      isSuperUser,
      postAttendanceDates(app));
  };
})();