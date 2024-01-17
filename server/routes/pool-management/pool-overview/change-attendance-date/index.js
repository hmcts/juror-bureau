;(function(){
  'use strict';

  var controller = require('./change-attendance-date.controller')
    , auth = require('../../../../components/auth');

  module.exports = function(app) {
    // Change next attendnace date
    app.post('/pool-management/:poolNumber/change-next-attendance/',
      'pool-overview.change-next-attendance.post',
      auth.verify,
      controller.postChangeAttendanceDate(app));

    app.get('/pool-management/:poolNumber/change-next-attendance/continue',
      'pool-overview.change-next-attendance.continue.get',
      auth.verify,
      controller.getChangeAttendanceDateContinue(app));

    app.post('/pool-management/:poolNumber/change-next-attendance/continue',
      'pool-overview.change-next-attendance.continue.post',
      auth.verify,
      controller.postChangeAttendanceDateContinue(app));

    app.get('/pool-management/:poolNumber/change-next-attendance/confirm',
      'pool-overview.change-next-attendance.confirm.get',
      auth.verify,
      controller.getChangeAttendanceDateConfirm(app));

    app.post('/pool-management/:poolNumber/change-next-attendance/confirm',
      'pool-overview.change-next-attendance.confirm.post',
      auth.verify,
      controller.postChangeAttendanceDateConfirm(app));

  };
})();
