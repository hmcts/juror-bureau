(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./trial-management.controller');
  const returnsController = require('./returns.controller');

  module.exports = function(app) {
    require('./create-trial')(app);
    require('./edit-trial')(app);
    require('./generate-panel')(app);
    require('./empanel-jury')(app);

    app.get('/trial-management/trials',
      'trial-management.trials.get',
      auth.verify,
      controller.getTrials(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/detail',
      'trial-management.trials.detail.get',
      auth.verify,
      controller.getTrialDetail(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/return',
      'trial-management.trials.return.post',
      auth.verify,
      returnsController.postReturnJurors(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/return/attendance',
      'trial-management.trials.return.attendance.get',
      auth.verify,
      returnsController.getReturnAttendance(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/return/attendance',
      'trial-management.trials.return.attendance.post',
      auth.verify,
      returnsController.postReturnAttendance(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/return/check-out',
      'trial-management.trials.return.check-out.get',
      auth.verify,
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
      returnsController.getReturnConfirm(app),
    );
    app.post('/trial-management/trials/:trialNumber/:locationCode/return/confirm',
      'trial-management.trials.return.confirm.post',
      auth.verify,
      returnsController.postReturnConfirm(app),
    );
  };
})();
