const { postEditAudit, getEditAudit } = require('../../../reporting/audit.controller');

(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./edit-approval-expenses.controller');
  const { expenseStatus } = require('../../../../components/route-parameter-constraints');

  module.exports = function(app) {

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status',
      'juror-management.edit-expense.get',
      expenseStatus,
      auth.verify,
      controller.getEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status/preview',
      'juror-management.edit-expense.preview.post',
      expenseStatus,
      auth.verify,
      postEditAudit(app));
    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status/preview',
      'juror-management.edit-expense.preview.get',
      expenseStatus,
      auth.verify,
      getEditAudit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status',
      'juror-management.edit-expense.post',
      expenseStatus,
      auth.verify,
      controller.postEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status/edit',
      'juror-management.edit-expense.edit.get',
      expenseStatus,
      auth.verify,
      controller.getEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status/edit',
      'juror-management.edit-expense.edit.post',
      expenseStatus,
      auth.verify,
      controller.postEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status/apply-to-all',
      'juror-management.edit-expense.apply-to-all.post',
      expenseStatus,
      auth.verify,
      controller.postEditApprovalExpensesEditApplyToAll(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status/apply-default-loss',
      'juror-management.edit-expense.apply-default-loss.get',
      expenseStatus,
      auth.verify,
      controller.postEditApprovalExpensesEditApplyToAll(app));
  };

})();
