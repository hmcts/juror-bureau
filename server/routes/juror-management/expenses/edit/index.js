const { checkRouteParam } = require('../../../../lib/mod-utils');
const { postEditAudit, getEditAudit } = require('../../../reporting/audit.controller');

(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./edit-approval-expenses.controller');

  module.exports = function(app) {

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status',
      'juror-management.edit-expense.get',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      controller.getEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status/preview',
      'juror-management.edit-expense.preview.post',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      postEditAudit(app));
    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status/preview',
      'juror-management.edit-expense.preview.get',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      getEditAudit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status',
      'juror-management.edit-expense.post',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      controller.postEditApprovalExpenses(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status/edit',
      'juror-management.edit-expense.edit.get',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      controller.getEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status/edit',
      'juror-management.edit-expense.edit.post',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      controller.postEditApprovalExpensesEdit(app));

    // eslint-disable-next-line max-len
    app.post('/juror-management/edit-expense/:jurorNumber/:locCode/:status/apply-to-all',
      'juror-management.edit-expense.apply-to-all.post',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      controller.postEditApprovalExpensesEditApplyToAll(app));

    // eslint-disable-next-line max-len
    app.get('/juror-management/edit-expense/:jurorNumber/:locCode/:status/apply-default-loss',
      'juror-management.edit-expense.apply-default-loss.get',
      auth.verify,
      checkRouteParam('status', ['draft', 'for-approval', 'for-reapproval', 'approved']),
      controller.postEditApprovalExpensesEditApplyToAll(app));
  };

})();
