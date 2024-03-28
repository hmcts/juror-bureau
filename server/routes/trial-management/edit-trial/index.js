const auth = require('../../../components/auth');
const controller = require('./edit-trial.controller');
const { isCourtUser } = require('../../../components/auth/user-type');

module.exports = function (app) {

  app.get('/trial-management/edit-trial/:trialNumber/:locationCode',
    'trial-management.edit-trial.get',
    auth.verify,
    isCourtUser,
    controller.getEditTrial(app),
  );

  app.post('/trial-management/edit-trial/:trialNumber/:locationCode',
    'trial-management.edit-trial.post',
    auth.verify,
    isCourtUser,
    controller.postEditTrial(app),
  );

};
