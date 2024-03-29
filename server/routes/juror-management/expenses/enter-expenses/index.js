const auth = require('../../../../components/auth');
const controller = require('./enter-expenses.controller');
const { isCourtUser } = require('../../../../components/auth/user-type');

module.exports = function (app) {
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

  app.get('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses/travel-over-limit',
    'juror-management.enter-expenses.travel-over-limit.get',
    auth.verify,
    isCourtUser,
    controller.getTravelOverLimit(app));

  app.get('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses/total-less-zero',
    'juror-management.enter-expenses.total-less-zero.get',
    auth.verify,
    isCourtUser,
    controller.getTotalLessThanZero(app));

  // ajax call to recalculate summary totals
  app.post('/juror-management/expenses/:jurorNumber/:poolNumber/enter-expenses/recalculate-totals',
    'juror-management.enter-expenses.recalculate-totals.get',
    auth.verify,
    isCourtUser,
    controller.getRecalculateTotals(app));

};
