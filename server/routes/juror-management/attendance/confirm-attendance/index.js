(function() {
  'use strict';

  const controller = require('./confirm-attendance.controller');
  const auth = require('../../../../components/auth');
  const { isCourtUser } = require('../../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/juror-management/attendance/confirm-attendance',
      'juror-management.attendance.confirm-attendance.get',
      auth.verify,
      isCourtUser,
      controller.getConfirmAttendance(app));

    app.post('/juror-management/attendance/confirm-attendance',
      'juror-management.attendance.confirm-attendance.post',
      auth.verify,
      isCourtUser,
      controller.postConfirmAttendance(app));

    app.get('/juror-management/attendance/confirm-attendance/not-checked-out',
      'juror-management.attendance.confirm-attendance.not-checked-out.get',
      auth.verify,
      isCourtUser,
      controller.getNotCheckedOut(app));

    app.post('/juror-management/attendance/confirm-attendance/not-checked-out',
      'juror-management.attendance.confirm-attendance.not-checked-out.post',
      auth.verify,
      isCourtUser,
      controller.postNotCheckedOut(app));
  };

})();

