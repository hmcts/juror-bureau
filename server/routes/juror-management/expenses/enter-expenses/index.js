const { isCourtUser } = require('../../../../components/auth/user-type');

(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./enter-expenses.controller');

  module.exports = function(app) {
    app.get('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses',
      'juror-management.enter-expenses.get',
      auth.verify,
      isCourtUser,
      controller.getEnterExpenses(app));

    app.post('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses',
      'juror-management.enter-expenses.post',
      auth.verify,
      isCourtUser,
      controller.postEnterExpenses(app));

    app.post('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses/apply-to-all',
      'juror-management.enter-expenses.apply-to-all.post',
      auth.verify,
      isCourtUser,
      controller.postApplyExpensesToAll(app));

    app.get('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses/loss-over-limit',
      'juror-management.enter-expenses.loss-over-limit.get',
      auth.verify,
      isCourtUser,
      controller.getLossOverLimit(app));

    app.post('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses/loss-over-limit',
      'juror-management.enter-expenses.loss-over-limit.post',
      auth.verify,
      isCourtUser,
      controller.postLossOverLimit(app));

    app.get('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses/total-less-zero',
      'juror-management.enter-expenses.total-less-zero.get',
      auth.verify,
      isCourtUser,
      controller.getTotalLessThanZero(app));

  };

})();
