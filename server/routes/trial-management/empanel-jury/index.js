(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./empanel-jury.controller');

  module.exports = function(app) {

    app.get('/trial-management/trials/:trialNumber/:locationCode/empanel/number-of-juors',
      'trial-management.empanel.get',
      auth.verify,
      controller.getEmpanelAmount(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/empanel/number-of-juors',
      'trial-management.empanel.post',
      auth.verify,
      controller.postEmpanelAmount(app),
    );

    app.get('/trial-management/trials/:trialNumber/:locationCode/empanel/jurors-select',
      'trial-management.empanel.select.get',
      auth.verify,
      controller.getEmpanelJurors(app),
    );

    app.post('/trial-management/trials/:trialNumber/:locationCode/empanel/jurors-select',
      'trial-management.empanel.select.post',
      auth.verify,
      controller.postEmpanelJurors(app),
    );
  };
})();
