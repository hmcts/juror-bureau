const auth = require('../../../components/auth');
const controller = require('./generate-panel.controller');
const { isCourtUser } = require('../../../components/auth/user-type');

module.exports = function (app) {

  app.get('/trial-management/:locationCode/:trialNumber/generate-panel',
    'trial-management.generate-panel.get',
    auth.verify,
    isCourtUser,
    controller.getGeneratePanel(app),
  );

  app.post('/trial-management/:locationCode/:trialNumber/generate-panel',
    'trial-management.generate-panel.post',
    auth.verify,
    isCourtUser,
    controller.postGeneratePanel(app),
  );

  app.get('/trial-management/:locationCode/:trialNumber/generate-panel/select-pools',
    'trial-management.generate-panel.select-pools.get',
    auth.verify,
    isCourtUser,
    controller.getSelectPools(app),
  );

  app.post('/trial-management/:locationCode/:trialNumber/generate-panel/select-pools',
    'trial-management.generate-panel.select-pools.post',
    auth.verify,
    isCourtUser,
    controller.postSelectPools(app),
  );

};
