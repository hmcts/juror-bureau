(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./expenses.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    require('./edit')(app);
    require('./enter-expenses')(app);
    require('./non-attendance-day')(app);
    require('./edit-bank-details')(app);

    app.get('/juror-management/expenses/:jurorNumber/:poolNumber/default-expenses',
      'juror-management.default-expenses.get',
      auth.verify,
      isCourtUser,
      controller.getDefaultExpenses(app));

    app.post('/juror-management/expenses/:jurorNumber/:poolNumber/default-expenses',
      'juror-management.default-expenses.post',
      auth.verify,
      isCourtUser,
      controller.postDefaultExpenses(app));

  };

})();
