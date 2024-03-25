(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./expense-limits-transport.controller');
  const { isCourtManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/administration/expense-limits-transport',
      'administration.expense-limits-transport.get',
      auth.verify,
      isCourtManager,
      controller.getExpenseLimitsTransport(app),
    );

    app.post('/administration/expense-limits-transport',
      'administration.expense-limits-transport.post',
      auth.verify,
      isCourtManager,
      controller.postExpenseLimitsTransport(app)
    );

  };
})();
