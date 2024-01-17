(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./expenses.controller');

  module.exports = function(app) {
    app.get('/juror-management/expenses/:jurorNumber/default-expenses',
      'juror-management.default-expenses.get',
      auth.verify,
      controller.getDefaultExpenses(app));

      app.post('/juror-management/expenses/:jurorNumber/default-expenses',
      'juror-management.default-expenses.post',
      auth.verify,
      controller.postDefaultExpenses(app));
  };

})();
