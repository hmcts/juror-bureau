const controller = require('./attendance.controller');
const changeTimesController = require('./change-times/change-times.controller');
const auth = require('../../../components/auth');

module.exports = function (app) {
  require('./confirm-attendance')(app);

  app.post('/juror-management/attendance/check-in',
    'juror-management.check-in.post',
    auth.verify,
    controller.postCheckIn(app),
  );

  app.post('/juror-management/attendance/check-out',
    'juror-management.check-out.post',
    auth.verify,
    controller.postCheckOut(app),
  );

  app.post('/juror-management/attendance/check-out-all-jurors',
    'juror-management.check-out-all-jurors.post',
    auth.verify,
    controller.postCheckOutAllJurors(app),
  );

  app.get('/juror-management/attendance/check-out-panelled',
    'juror-management.check-out-panelled.get',
    auth.verify,
    controller.getCheckOutPanelledJurors(app),
  );

  app.post('/juror-management/attendance/check-out-panelled',
    'juror-management.check-out-panelled.post',
    auth.verify,
    controller.postCheckOutPanelledJurors(app),
  );

  app.get('/juror-management/attendance/:jurorNumber/change-times',
    'juror-management.attendance.change-times.get',
    auth.verify,
    changeTimesController.getChangeTimes(app),
  );

  app.post('/juror-management/attendance/:jurorNumber/change-times',
    'juror-management.attendance.change-times.post',
    auth.verify,
    changeTimesController.postChangeTimes(app),
  );

  app.get('/juror-management/attendance/:jurorNumber/delete-attendance',
    'juror-management.attendance.delete-attendance.get',
    auth.verify,
    controller.getDeleteAttendance(app),
  );

  app.post('/juror-management/attendance/:jurorNumber/delete-attendance',
    'juror-management.attendance.delete-attendance.post',
    auth.verify,
    controller.postDeleteAttendance(app),
  );

};
