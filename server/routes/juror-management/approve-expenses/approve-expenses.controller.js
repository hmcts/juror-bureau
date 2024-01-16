(function() {
  'use strict';

  const _ = require('lodash'),
    validate = require('validate.js'),
    urljoin = require('url-join'),
    approveExpensesFilterValidation = require('../../../config/validation/approve-expenses');

  module.exports.getBACSAndCheque = function(app) {
    return function(req, res) {

      let bannerMessage;

      let data = require('../../../stores/expenses').expensesApproval;
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpBody = _.cloneDeep(req.session.tmpBody);

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;
      delete req.session.newJuror;
      delete req.session.errors;
      delete req.session.tmpBody;
      const processUrl = app.namedRoutes.build('juror-management.approve-expenses.bacs-and-cheque.post');

      return res.render('juror-management/approve-expenses.njk', {
        processUrl,
        tmpBody,
        nav: 'approve-expenses',
        jurorApprovalCount: data.length,
        currentTab: 'bacs-and-cheque',
        bannerMessage,
        jurors: data,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postBACSAndCheque = function(app) {
    return function(req, res) {

      const redirectUrl = app.namedRoutes.build('juror-management.approve-expenses.bacs-and-cheque.get');
      const validateFilter = validate(req.body, approveExpensesFilterValidation());

      delete req.session.errors;
      req.session.tmpBody = req.body;
      if (typeof validateFilter !== 'undefined') {
        req.session.errors = validateFilter;

        return res.redirect(urljoin(redirectUrl, urlBuilder(req.body)));
      }
      return res.redirect(urljoin(redirectUrl, urlBuilder(req.body)));
    };
  };

  function urlBuilder(params, clearFilter = false) {

    var parameters = [];

    if (params.page) {
      parameters.push('page=' + params.page);
    }

    if (!clearFilter) {
      if (params.filterStartDate) {
        parameters.push('filterStartDate=' + params.filterStartDate);
      }

      if (params.filterEndDate) {
        parameters.push('filterEndDate=' + params.filterEndDate);
      }
    } else {
      parameters.push('clearFilter=true');
    }

    return  '?' + parameters.join('&');
  }


  module.exports.getCash = function(app) {
    return function(req, res) {

      delete req.session.bannerMessage;
      delete req.session.newJuror;

      return res.render('juror-management/approve-expenses.njk', {
        nav: 'approve-expenses',
        jurorApprovalCount: req.session.jurorApprovalCount,
        currentTab: 'cash',
      });
    };
  };

  module.exports.getViewExpenses = function(app) {
    return async function(req, res){
      try {
        const auditNumber = await resolver();

        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.detail.get',
          {auditNumber: auditNumber}));
      } catch (err) {
        app.logger.crit('Unable to uncomplete service', {
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
    return new Promise(res => res('1324354657'));
  };
})();
