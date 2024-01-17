(function() {
  'use strict';


  module.exports.getExpenseRecord = function(app) {
    return function(req, res) {
      let data;
      const currentTab = req.query['status'] || 'draft';
      const setExpensesUrl = app.namedRoutes.build('juror-management.default-expenses.get', {
        jurorNumber: req.params.jurorNumber});

      // STUBBED till BE is ready, calls will be replaced
      if (currentTab === 'draft') {
        data = require('../../../../stores/expenses').draft;
      } else if (currentTab === 'forApproval') {
        data = require('../../../../stores/expenses').forApproval;
      } else if (currentTab === 'approved') {
        data = require('../../../../stores/expenses').approved;
      }

      return res.render('juror-management/expense-record/expense-record.njk', {
        backLinkUrl: '#',
        setExpensesUrl,
        nav: 'unpaid-attendance',
        jurorApprovalCount: req.session.jurorApprovalCount,
        currentTab: currentTab,
        data: data,
      });
    };
  };


  module.exports.getExpenseRecordDetail = function(app) {
    return function(req, res) {
      // STUBBED till BE is ready, call will be replaced
      const data = require('../../../../stores/expenses').detail
        , status = data.status;
      let backLinkUrl;
      let approveUrl;

      approveUrl = app.namedRoutes.build(
        'juror-management.unpaid-attendance.expense-record.approved.post', {auditNumber: req.params.auditNumber}
      );
      if (status === 'forApproval') {
        backLinkUrl = app.namedRoutes.build(
          'juror-management.unpaid-attendance.expense-record.get', {jurorNumber: '841501025'}
        ) + '?status=forApproval';
      } else if (status === 'approved') {
        backLinkUrl = app.namedRoutes.build(
          'juror-management.unpaid-attendance.expense-record.get', {jurorNumber: '841501025'}
        ) + '?status=approved';
      }
      return res.render('juror-management/expense-record/expense-detail.njk', {
        backLinkUrl,
        approveUrl,
        nav: 'unpaid-attendance',
        jurorApprovalCount: req.session.jurorApprovalCount,
        data: data,
        status: data.status,
      });
    };
  };

  module.exports.getNotApproved = function(app) {
    return function(req, res){
      let backLinkUrl = app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.detail.get', 
        {auditNumber: req.params.auditNumber});

      return res.render('juror-management/_errors/approval-denied.njk', {backLinkUrl: backLinkUrl}
      );
    };
  };

  module.exports.postExpensesApproval = function(app) {
    return async function(req, res){
      const data = require('../../../../stores/expenses').detail;

      if (req.session.authentication.login === data.submittedBy){
        return res.redirect(app.namedRoutes.build('juror-management.not-approved.get', {
          auditNumber: req.params.auditNumber,
        }));
      }
      try {
        await resolver();
        req.session.bannerMessage = 'Expenses approved for '+ req.body.name + ' and sent to printer';

        return res.redirect(app.namedRoutes.build('juror-management.approve-expenses.bacs-and-cheque.get'));
      } catch (err) {
        app.logger.crit('Unable to approve expense', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };

  };

  //TODO delete resolver once backend is ready
  function resolver() {
    return new Promise(res => res(''));
  };

})();
