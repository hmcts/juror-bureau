(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./trial-management.controller');
  const trialManagementPrintController = require('./trial-management.print.controller');
  const returnsController = require('./returns.controller');
  const { isCourtUser } = require('../../components/auth/user-type');

  module.exports = function(app) {
    require('./create-trial')(app);
    require('./edit-trial')(app);
    require('./generate-panel')(app);
    require('./empanel-jury')(app);
    require('./add-panel-members')(app);
    require('./reassign-panel')(app);

    app.get('/trial-management/trials',
      'trial-management.trials.get',
      auth.verify,
      isCourtUser,
      controller.getTrials(app),
    );

    app.get('/trial-management/trials/print',
      'trial-management.trials.print.get',
      auth.verify,
      isCourtUser,
      trialManagementPrintController.getPrintTrials(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/detail',
      'trial-management.trials.detail.get',
      auth.verify,
      isCourtUser,
      controller.getTrialDetail(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/return',
      'trial-management.trials.return.post',
      auth.verify,
      isCourtUser,
      returnsController.postReturnJurors(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/return/attendance',
      'trial-management.trials.return.attendance.get',
      auth.verify,
      isCourtUser,
      returnsController.getReturnAttendance(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/return/attendance',
      'trial-management.trials.return.attendance.post',
      auth.verify,
      isCourtUser,
      returnsController.postReturnAttendance(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/return/check-out',
      'trial-management.trials.return.check-out.get',
      auth.verify,
      isCourtUser,
      returnsController.getReturnCheckOut(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/return/check-out',
      'trial-management.trials.return.check-out.post',
      auth.verify,
      returnsController.postReturnCheckOut(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/return/confirm',
      'trial-management.trials.return.confirm.get',
      auth.verify,
      isCourtUser,
      returnsController.getReturnConfirm(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/return/confirm',
      'trial-management.trials.return.confirm.post',
      auth.verify,
      isCourtUser,
      returnsController.postReturnConfirm(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/end-trial',
      'trial-management.trials.end-trial.get',
      auth.verify,
      isCourtUser,
      controller.getEndTrial(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/end-trial',
      'trial-management.trials.end-trial.post',
      auth.verify,
      isCourtUser,
      controller.postEndTrial(app),
    );
  };
})();
