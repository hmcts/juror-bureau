(() => {
  'use strict';

  const { getExpenseLimitAdjustmentAuditRedirect } = require('./expense-limit-adjustments-audit.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/expense-limit-adjustments-audit/redirect/:locCode/:transportType',
      'reports.expense-limit-adjustments-audit.redirect.get',
      auth.verify,
      getExpenseLimitAdjustmentAuditRedirect(app));
  };
})();
