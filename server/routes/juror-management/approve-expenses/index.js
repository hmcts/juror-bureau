(function() {
  'use strict';

  const controller = require('./approve-expenses.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {

    app.get('/juror-management/approve-expenses/bacs-and-cheque',
      'juror-management.approve-expenses.bacs-and-cheque.get',
      auth.verify,
      controller.getBACSAndCheque(app),
    );

    app.get('/juror-management/approve-expenses/cash',
      'juror-management.approve-expenses.cash.get',
      auth.verify,
      controller.getCash(app),
    );

    app.get('/juror-management/approve-expenses/view-expenses/:jurorNumber',
      'juror-management.approve-expenses.view-expenses.get',
      auth.verify,
      controller.getViewExpenses(app),
    );

    app.post('/juror-management/approve-expenses/bacs-and-cheque',
      'juror-management.approve-expenses.bacs-and-cheque.post',
      auth.verify,
      controller.postBACSAndCheque(app),
    );

  };

})();
