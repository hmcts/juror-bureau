(function() {
  'use strict';

  const _ = require('lodash'),
    validate = require('validate.js'),
    urljoin = require('url-join'),
    approveExpensesFilterValidation = require('../../../config/validation/approve-expenses'),
    mockData = require('../../../stores/expenses').expensesApproval;

  module.exports.getApproveExpenses = function(app) {
    return async function(req, res) {
      let bannerMessage;
      let currentTab = typeof req.query.tab !== 'undefined' ? req.query.tab : 'bacs-and-cheque';
      let approvalData = {
        'bacs-and-cheque': [],
        'cash': [],
      };
      let params = {
        filterStartDate: req.query.filterStartDate,
        filterEndDate: req.query.filterEndDate,
      };
      let tabsUrls = {
        bacsAndCheque: urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.get'),
          urlBuilder(params, 'bacs-and-cheque')),
        cash: urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.get'),
          urlBuilder(params, 'cash')),
      };
      const processUrl = app.namedRoutes.build('juror-management.approve-expenses.post');
      const processDateFilterUrl = app.namedRoutes.build('juror-management.approve-expenses.filter-dates.post');
      const tmpErrors = _.cloneDeep(req.session.errors);

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;
      delete req.session.errors;

      try {

        // TODO: replace with API call once BE is ready
        const data = await getApprovalExpensesResolver();

        // TEMP - we don't yet know how we will get this data from the BE
        for (let i = 0; i < data.length; i++) {
          if (data[i].paymentMethod === 'BACS and cheque') {
            approvalData['bacs-and-cheque'].push(data[i]);
          } else {
            approvalData['cash'].push(data[i]);
          }
        };

        return res.render('juror-management/approve-expenses.njk', {
          processUrl,
          processDateFilterUrl,
          params,
          tabsUrls,
          currentTab,
          approvalData,
          bannerMessage,
          clearFilter: app.namedRoutes.build('juror-management.approve-expenses.get'),
          nav: 'approve-expenses',
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Unable to fetch approval expenses data', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  // TEMP - awaiting screens design finalisation as they seem to keep changing on Figma
  module.exports.postApproveExpenses = function(app) {
    return function(req, res) {

      // TODO: Bulk approve - check who has submitted each audit. A user cannot approve an audit they have created.
      // checklist validation to be added when the design team has finalised the error messages

      req.session.bannerMessage = 'Expenses approved for '
        + req.body.selectedJurors.length + ' jurors and sent to printer';

      return res.redirect(app.namedRoutes.build('juror-management.approve-expenses.get'));
    };
  };

  module.exports.postFilterByDate = function(app) {
    return function(req, res) {
      const redirectUrl = urljoin(
        app.namedRoutes.build('juror-management.approve-expenses.get'),
        urlBuilder(req.body, req.body.currentTab));
      const validateFilter = validate(req.body, approveExpensesFilterValidation());

      delete req.session.errors;

      req.session.tmpBody = _.cloneDeep(req.body);

      if (typeof validateFilter !== 'undefined') {
        req.session.errors = validateFilter;

        return res.redirect(redirectUrl);
      }

      delete req.session.tmpBody;

      return res.redirect(redirectUrl);
    };
  };

  module.exports.getViewExpenses = function(app) {
    return async function(req, res){
      try {
        // TEMP - we do not yet know how we will get the auditNumber from the BE
        // TODO: replace with API call once BE is ready
        const auditNumber = await getAuditNumberResolver();

        return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.detail.get', {
          auditNumber: auditNumber,
        }));
      } catch (err) {
        app.logger.crit('Unable to get detailed expense record', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  function urlBuilder(params, currentTab) {

    var parameters = [];

    parameters.push('tab=' + currentTab);

    if (params.filterStartDate) {
      parameters.push('filterStartDate=' + params.filterStartDate);
    }
    if (params.filterEndDate) {
      parameters.push('filterEndDate=' + params.filterEndDate);
    }

    return  '?' + parameters.join('&');
  };

  //TODO delete resolvers once backend is ready
  function getAuditNumberResolver() {
    return new Promise(res => res('1324354657'));
  };
  function getApprovalExpensesResolver() {
    return new Promise(res => res(mockData));
  };
})();
