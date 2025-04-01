(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./add-non-attendance-day.controller');
  const nonAttendanceController = 
    require('../../juror-management/expenses/non-attendance-day/non-attendance-day.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.post('/trial-management/trials/:trialNumber/:locationCode/add-non-attendance-day/jurors',
      'trial-management.trials.add-non-attendance-day.jurors.post',
      auth.verify,
      isCourtUser,
      controller.postAddNonAttendance(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/add-non-attendance-day',
      'trial-management.trials.add-non-attendance-day.get',
      auth.verify,
      isCourtUser,
      nonAttendanceController.getNonAttendanceDay(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/add-non-attendance-day',
      'trial-management.trials.add-non-attendance-day.post',
      auth.verify,
      isCourtUser,
      nonAttendanceController.postNonAttendanceDay(app),
    );
  };

})();