(function() {
  'use strict';

  const controller = require('./expense-record.controller');
  const auth = require('../../../../components/auth');

  module.exports = function(app) {

    app.get('/juror-management/unpaid-attendance/expense-record/:jurorNumber/:poolNumber',
      'juror-management.unpaid-attendance.expense-record.get',
      auth.verify,
      controller.getExpenseRecord(app),
    );

    app.post('/juror-management/unpaid-attendance/expense-record/check',
      'sjo-tasks.uncomplete-service.check-uncheck.post',
      auth.verify,
      controller.postCheckExpense(app));

    app.post('/juror-management/unpaid-attendance/expense-record/:jurorNumber/:poolNumber/submit',
      'juror-management.unpaid-attendance.expense-record.submit.post',
      auth.verify,
      controller.postSubmitExpenses(app),
    );

    app.get('/juror-management/unpaid-attendance/expense-record/:jurorNumber/:poolNumber/detail/:auditNumber',
      'juror-management.unpaid-attendance.expense-record.detail.get',
      auth.verify,
      controller.getExpenseRecordDetail(app),
    );

    app.get('/juror-management/not-approved/:auditNumber',
      'juror-management.not-approved.get',
      auth.verify,
      controller.getNotApproved(app),
    );

    app.post('/juror-management/unpaid-attendance/expense-record/approved/:auditNumber',
      'juror-management.unpaid-attendance.expense-record.approved.post',
      auth.verify,
      controller.postExpensesApproval(app),
    );

  };

})();
