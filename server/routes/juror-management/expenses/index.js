(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./expenses.controller');

  module.exports = function(app) {

    require('./enter-expenses')(app);
    require('./non-attendance-day')(app);

    app.get('/juror-management/expenses/:jurorNumber/:poolNumber/default-expenses',
      'juror-management.default-expenses.get',
      auth.verify,
      controller.getDefaultExpenses(app));

    app.post('/juror-management/expenses/:jurorNumber/:poolNumber/default-expenses',
      'juror-management.default-expenses.post',
      auth.verify,
      controller.postDefaultExpenses(app));
  };

})();
