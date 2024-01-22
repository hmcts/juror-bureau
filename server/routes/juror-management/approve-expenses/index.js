(function() {
  'use strict';

  const controller = require('./approve-expenses.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {

    app.get('/juror-management/approve-expenses',
      'juror-management.approve-expenses.get',
      auth.verify,
      controller.getApproveExpenses(app),
    );

    app.post('/juror-management/approve-expenses',
      'juror-management.approve-expenses.post',
      auth.verify,
      controller.postApproveExpenses(app),
    );

    app.get('/juror-management/approve-expenses/view-expenses/:jurorNumber',
      'juror-management.approve-expenses.view-expenses.get',
      auth.verify,
      controller.getViewExpenses(app),
    );

    app.post('/juror-management/approve-expenses/bacs-and-cheque',
      'juror-management.approve-expenses.filter-dates.post',
      auth.verify,
      controller.postFilterByDate(app),
    );

  };

})();
