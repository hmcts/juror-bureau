(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./edit-approval-expenses.controller');
  const { isCourtUser } = require('../../../../components/auth/user-type');

  module.exports = function(app) {

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)',
      'juror-management.edit-expense.get',
      auth.verify,
      isCourtUser,
      controller.getEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)',
      'juror-management.edit-expense.post',
      auth.verify,
      isCourtUser,
      controller.postEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)/edit',
      'juror-management.edit-expense.edit.get',
      auth.verify,
      isCourtUser,
      controller.getEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)/edit',
      'juror-management.edit-expense.edit.post',
      auth.verify,
      isCourtUser,
      controller.postEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)/apply-to-all',
      'juror-management.edit-expense.apply-to-all.post',
      auth.verify,
      isCourtUser,
      controller.postEditApprovalExpensesEditApplyToAll(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)/apply-default-loss',
      'juror-management.edit-expense.apply-default-loss.get',
      auth.verify,
      isCourtUser,
      controller.postEditApprovalExpensesEditApplyToAll(app));
  };

})();
