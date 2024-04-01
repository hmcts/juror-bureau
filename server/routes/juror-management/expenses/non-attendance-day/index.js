(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./non-attendance-day.controller');
  const { isCourtUser } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/juror-management/unpaid-attendance/non-attendance-day/:jurorNumber/:poolNumber',
      'juror-management.non-attendance-day.get',
      auth.verify,
      isCourtUser,
      controller.getNonAttendanceDay(app));

    app.post('/juror-management/unpaid-attendance/non-attendance-day/:jurorNumber/:poolNumber',
      'juror-management.non-attendance-day.post',
      auth.verify,
      isCourtUser,
      controller.postNonAttendanceDay(app));
  };

})();
