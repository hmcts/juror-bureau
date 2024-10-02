(function() {
  'use strict';

  const controller = require('./unconfirmed-attendances.controller');
  const changeTimesController = require('../change-times/change-times.controller');
  const auth = require('../../../../components/auth');

  module.exports = function(app) {
    app.get('/juror-management/attendance/unconfirmed-attendances',
      'juror-management.attendance.unconfirmed-attendances.get',
      auth.verify,
      controller.getUnconfirmedAttendances(app)
    );

    app.get('/juror-management/attendance/unconfirmed-attendances/:jurorNumber/update',
      'juror-management.attendance.unconfirmed-attendances.update.get',
      auth.verify,
      changeTimesController.getChangeTimes(app),
    );

    app.post('/juror-management/attendance/unconfirmed-attendances/:jurorNumber/update',
      'juror-management.attendance.unconfirmed-attendances.update.post',
      auth.verify,
      controller.postUpdateAttendance(app),
    );
  };

})();
