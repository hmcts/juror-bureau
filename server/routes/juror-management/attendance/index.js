const { isCourtUser } = require('../../../components/auth/user-type');

(function() {
  'use strict';

  const controller = require('./attendance.controller')
    , changeTimesController = require('./change-times/change-times.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    require('./confirm-attendance')(app);

    app.post('/juror-management/attendance/check-in',
      'juror-management.check-in.post',
      auth.verify,
      isCourtUser,
      controller.postCheckIn(app),
    );

    app.post('/juror-management/attendance/check-out',
      'juror-management.check-out.post',
      auth.verify,
      isCourtUser,
      controller.postCheckOut(app),
    );

    app.post('/juror-management/attendance/check-out-all-jurors',
      'juror-management.check-out-all-jurors.post',
      auth.verify,
      isCourtUser,
      controller.postCheckOutAllJurors(app),
    );

    app.get('/juror-management/attendance/check-out-panelled',
      'juror-management.check-out-panelled.get',
      auth.verify,
      isCourtUser,
      controller.getCheckOutPanelledJurors(app),
    );

    app.post('/juror-management/attendance/check-out-panelled',
      'juror-management.check-out-panelled.post',
      auth.verify,
      isCourtUser,
      controller.postCheckOutPanelledJurors(app),
    );

    app.get('/juror-management/attendance/:jurorNumber/change-times',
      'juror-management.attendance.change-times.get',
      auth.verify,
      isCourtUser,
      changeTimesController.getChangeTimes(app)
    );

    app.post('/juror-management/attendance/:jurorNumber/change-times',
      'juror-management.attendance.change-times.post',
      auth.verify,
      isCourtUser,
      changeTimesController.postChangeTimes(app)
    );

    app.get('/juror-management/attendance/:jurorNumber/delete-attendance',
      'juror-management.attendance.delete-attendance.get',
      auth.verify,
      isCourtUser,
      controller.getDeleteAttendance(app)
    );

    app.post('/juror-management/attendance/:jurorNumber/delete-attendance',
      'juror-management.attendance.delete-attendance.post',
      auth.verify,
      isCourtUser,
      controller.postDeleteAttendance(app)
    );

  };

})();
