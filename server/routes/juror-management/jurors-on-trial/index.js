/* eslint-disable strict */

const auth = require('../../../components/auth');
const { isCourtUser } = require('../../../components/auth/user-type');
const controller = require('./jurors-on-trial.controller');

module.exports = function(app) {
  app.get('/juror-management/jurors-on-trial',
    'juror-management.jurors-on-trial.get',
    auth.verify,
    isCourtUser,
    controller.getJurorsOnTrial(app),
  );

  app.get('/juror-management/jurors-on-trial/:trialNumber/confirm-attendance',
    'juror-management.jurors-on-trial.confirm-attendance.get',
    auth.verify,
    isCourtUser,
    controller.getConfirmAttendance(app),
  );

  app.post('/juror-management/jurors-on-trial/:trialNumber/confirm-attendance',
    'juror-management.jurors-on-trial.confirm-attendance.post',
    auth.verify,
    isCourtUser,
    controller.postConfirmAttendance(app),
  );
};
