const auth = require('../../../components/auth');
const controller = require('./empanel-jury.controller');
const { isCourtUser } = require('../../../components/auth/user-type');

module.exports = function (app) {

  app.get('/trial-management/trials/:trialNumber/:locationCode/empanel/number-of-juors',
    'trial-management.empanel.get',
    auth.verify,
    isCourtUser,
    controller.getEmpanelAmount(app),
  );

  app.post('/trial-management/trials/:trialNumber/:locationCode/empanel/number-of-juors',
    'trial-management.empanel.post',
    auth.verify,
    isCourtUser,
    controller.postEmpanelAmount(app),
  );

  app.get('/trial-management/trials/:trialNumber/:locationCode/empanel/jurors-select',
    'trial-management.empanel.select.get',
    auth.verify,
    isCourtUser,
    controller.getEmpanelJurors(app),
  );

  app.post('/trial-management/trials/:trialNumber/:locationCode/empanel/jurors-select',
    'trial-management.empanel.select.post',
    auth.verify,
    isCourtUser,
    controller.postEmpanelJurors(app),
  );
};
