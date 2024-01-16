(function() {
  'use strict';

  var controller = require('./confirm-attendance.controller')
    , auth = require('../../../../components/auth');

  module.exports = function(app) {
    app.get('/juror-management/attendance/confirm-attendance',
      'juror-management.attendance.confirm-attendance.get',
      auth.verify,
      controller.getConfirmAttendance(app));

    app.post('/juror-management/attendance/confirm-attendance',
      'juror-management.attendance.confirm-attendance.post',
      auth.verify,
      controller.postConfirmAttendance(app));

    app.get('/juror-management/attendance/confirm-attendance/not-checked-out',
      'juror-management.attendance.confirm-attendance.not-checked-out.get',
      auth.verify,
      controller.getNotCheckedOut(app));

    app.post('/juror-management/attendance/confirm-attendance/not-checked-out',
      'juror-management.attendance.confirm-attendance.not-checked-out.post',
      auth.verify,
      controller.postNotCheckedOut(app));
  };

})();

