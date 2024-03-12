(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./expense-limits.controller');
  const { isSystemAdministrator } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/administration/expense-limits',
      'administration.expense-limits.get',
      auth.verify,
      isSystemAdministrator,
      controller.getExpenseLimits(app),
    );

    app.post('/administration/expense-limits',
      'administration.expense-limits.post',
      auth.verify,
      isSystemAdministrator,
      controller.postExpenseLimits(app)
    );

  };
})();
