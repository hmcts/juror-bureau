(function() {
  'use strict';

  const controller = require('./approve-expenses.controller');
  const auth = require('../../../components/auth');
  const { isCourtManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.get('/juror-management/approve-expenses',
      'juror-management.approve-expenses.get',
      auth.verify,
      isCourtManager,
      controller.getApproveExpenses(app),
    );

    app.post('/juror-management/approve-expenses',
      'juror-management.approve-expenses.post',
      auth.verify,
      isCourtManager,
      controller.postApproveExpenses(app),
    );

    app.post('/juror-management/approve-expenses/filter',
      'juror-management.approve-expenses.filter-dates.post',
      auth.verify,
      isCourtManager,
      controller.postFilterByDate(app),
    );

    app.get('/juror-management/approve-expenses/cannot-approve',
      'juror-management.approve-expenses.cannot-approve.get',
      auth.verify,
      isCourtManager,
      controller.getCannotApprove(app)
    );

    app.post('/juror-management/approve-expenses/cannot-approve',
      'juror-management.approve-expenses.cannot-approve.post',
      auth.verify,
      isCourtManager,
      controller.postCannotApprove(app)
    );

    app.get('/juror-management/approve-expenses/view-expenses/:jurorNumber/:locCode/:status',
      'juror-management.approve-expenses.view-expenses.get',
      auth.verify,
      isCourtManager,
      controller.getViewExpenses(app),
    );

  };

})();
