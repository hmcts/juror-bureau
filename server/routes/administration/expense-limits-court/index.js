(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./expense-limits-court.controller');
  const { isCourtManager, isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/administration/expense-limits-court',
      'administration.expense-limits-court.get',
      auth.verify,
      isCourtUser,
      controller.getExpenseLimitsCourt(app),
    );

    app.post('/administration/expense-limits-court',
      'administration.expense-limits-court.post',
      auth.verify,
      isCourtManager,
      controller.postExpenseLimitsCourt(app)
    );

  };
})();
