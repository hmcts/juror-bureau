(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./non-attendance-day.controller');

  module.exports = function(app) {
    app.get('/juror-management/unpaid-attendance/non-attendance-day/:jurorNumber/:poolNumber',
      'juror-management.non-attendance-day.get',
      auth.verify,
      controller.getNonAttendanceDay(app));

    app.post('/juror-management/unpaid-attendance/non-attendance-day/:jurorNumber/:poolNumber',
      'juror-management.non-attendance-day.post',
      auth.verify,
      controller.postNonAttendanceDay(app));
  };

})();
