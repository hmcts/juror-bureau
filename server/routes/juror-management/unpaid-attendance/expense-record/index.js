const controller = require('./expense-record.controller');
const { getAddSmartcardSpend, postAddSmartcardSpend } = require('./add-smartcard-spend.controller');
const auth = require('../../../../components/auth');
const { getExpenseCountDAO } = require('../../../../objects/expense-record');

module.exports = function (app) {

  // eslint-disable-next-line max-len
  app.get('/juror-management/unpaid-attendance/expense-record/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)',
    'juror-management.unpaid-attendance.expense-record.get',
    auth.verify,
    getExpenseCountDAO.get(app),
    controller.getExpensesList(app),
  );

  // eslint-disable-next-line max-len
  app.post('/juror-management/unpaid-attendance/expense-record/:jurorNumber/:poolNumber/:status(draft|for-approval|for-reapproval|approved)',
    'juror-management.unpaid-attendance.expense-record.post',
    auth.verify,
    controller.postExpensesList(app),
  );

  app.get('/juror-management/unpaid-attendance/expense-record/:jurorNumber/:poolNumber/add-smartcard-spend',
    'juror-management.unpaid-attendance.expense-record.add-smartcard-spend.get',
    auth.verify,
    getAddSmartcardSpend(app),
  );

  app.post('/juror-management/unpaid-attendance/expense-record/:jurorNumber/:poolNumber/add-smartcard-spend',
    'juror-management.unpaid-attendance.expense-record.add-smartcard-spend.post',
    auth.verify,
    postAddSmartcardSpend(app),
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
