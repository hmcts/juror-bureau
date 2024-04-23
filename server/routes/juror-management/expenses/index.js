(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./expenses.controller');

  module.exports = function(app) {

    require('./edit')(app);
    require('./enter-expenses')(app);
    require('./non-attendance-day')(app);
    require('./edit-bank-details')(app);

    app.get('/juror-management/expense-record/:jurorNumber/:locCode/default-expenses',
      'juror-management.default-expenses.get',
      auth.verify,
      controller.getDefaultExpenses(app));

    app.post('/juror-management/expense-record/:jurorNumber/:locCode/default-expenses',
      'juror-management.default-expenses.post',
      auth.verify,
      controller.postDefaultExpenses(app));

  };

})();
