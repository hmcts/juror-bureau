(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./edit-approval-expenses.controller');

  module.exports = function(app) {

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status(draft|for-approval|for-reapproval|approved)',
      'juror-management.edit-expense.get',
      auth.verify,
      controller.getEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status(draft|for-approval|for-reapproval|approved)',
      'juror-management.edit-expense.post',
      auth.verify,
      controller.postEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status(draft|for-approval|for-reapproval|approved)/edit',
      'juror-management.edit-expense.edit.get',
      auth.verify,
      controller.getEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status(draft|for-approval|for-reapproval|approved)/edit',
      'juror-management.edit-expense.edit.post',
      auth.verify,
      controller.postEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status(draft|for-approval|for-reapproval|approved)/apply-to-all',
      'juror-management.edit-expense.apply-to-all.post',
      auth.verify,
      controller.postEditApprovalExpensesEditApplyToAll(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status(draft|for-approval|for-reapproval|approved)/apply-default-loss',
      'juror-management.edit-expense.apply-default-loss.get',
      auth.verify,
      controller.postEditApprovalExpensesEditApplyToAll(app));
  };

})();
