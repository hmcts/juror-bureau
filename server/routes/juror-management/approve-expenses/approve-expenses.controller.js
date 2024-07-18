(function() {
  'use strict';

  const _ = require('lodash'),
    validate = require('validate.js'),
    urljoin = require('url-join'),
    approveExpensesFilterValidation = require('../../../config/validation/approve-expenses'),
    { approveExpensesDAO } = require('../../../objects/expenses'),
    { dateFilter } = require('../../../components/filters'),
    { replaceAllObjKeys } = require('../../../lib/mod-utils');

  module.exports.getApproveExpenses = function(app) {
    return async function(req, res) {
      let bannerMessage;
      const currentTab = req.query.tab || 'BACS';
      const dateFilters = {
        from: req.query.from || '',
        to: req.query.to || '',
      };
      const tabsUrls = {
        bacsAndCheque: urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.get'),
          urlBuilder(dateFilters, 'BACS')),
        cash: urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.get'),
          urlBuilder(dateFilters, 'CASH')),
      };
      const processUrl = urljoin(
        app.namedRoutes.build('juror-management.approve-expenses.post'),
        urlBuilder(dateFilters, currentTab)
      );
      const processDateFilterUrl = app.namedRoutes.build('juror-management.approve-expenses.filter-dates.post');
      const tmpErrors = _.cloneDeep(req.session.errors);
      const tmpBody = _.cloneDeep(req.session.fromFields);
      const locCode = req.session.authentication.locCode;

      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }

      delete req.session.bannerMessage;
      delete req.session.errors;
      delete req.session.fromFields;

      try {
        let { response: data, headers } = await approveExpensesDAO.get(
          app,
          req,
          locCode,
          currentTab,
          dateFilters
        );

        req.session.approveExpensesEtag = headers.etag;

        app.logger.info('Fetched expenses awaiting approval: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            data,
          },
        });

        data = replaceAllObjKeys(_.cloneDeep(data), _.camelCase);

        const jurors = data.pendingApproval;

        const tabHeaders = {
          totalPendingBacs: data.totalPendingBacs,
          totalPendingCash: data.totalPendingCash,
        };

        req.session.approveExpenses = { jurors, tabHeaders };

        return res.render('juror-management/approve-expenses/approve-expenses.njk', {
          processUrl,
          processDateFilterUrl,
          dateFilters,
          tabsUrls,
          currentTab,
          jurors: req.session.approveExpenses.jurors,
          tabHeaders: req.session.approveExpenses.tabHeaders,
          tmpBody,
          bannerMessage,
          clearFilter: app.namedRoutes.build('juror-management.approve-expenses.get'),
          nav: 'approve-expenses',
          locCode,
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

        console.log(err);

        return res.render('_errors/generic.njk');
      };
    };
  };

  module.exports.postApproveExpenses = function(app) {
    return async function(req, res) {
      const currentTab = req.query.tab || 'BACS';
      const dateFilters = {
        from: req.query.from || '',
        to: req.query.to || '',
      };
      const redirectUrl = urljoin(
        app.namedRoutes.build('juror-management.approve-expenses.get'),
        urlBuilder(dateFilters, currentTab)
      );
      const jurors = _.clone(req.session.approveExpenses.jurors);

      delete req.session.approveExpenses.jurors;

      if (!req.body.selectedJurors) {
        req.session.errors = {
          selectedJurors: [{
            summary: 'Select at least one juror\'s expenses to approve',
            details: 'Select at least one juror\'s expenses to approve',
          }],
        };

        return res.redirect(redirectUrl);
      }

      const checkedJurors = jurors.filter(
        j => req.body.selectedJurors.includes(`${j.jurorNumber}-${_.camelCase(j.expenseType)}`)
      );

      req.session.approveExpenses.checkedJurors = checkedJurors;

      if (checkedJurors.some((j) => !j.canApprove)){
        return res.redirect(urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.cannot-approve.get'),
          urlBuilder(dateFilters, currentTab)
        ));
      }

      return sendApprovalRequest(app, req, res);
    };
  };

  module.exports.getCannotApprove = function(app) {
    return function(req, res) {
      const currentTab = req.query.tab || 'BACS';
      const dateFilters = {
        from: req.query.from || '',
        to: req.query.to || '',
      };
      const checkedJurors = _.clone(req.session.approveExpenses.checkedJurors);
      const canApprove = checkedJurors.filter(j => j.canApprove);

      return res.render('juror-management/approve-expenses/cannot-approve.njk', {
        canApproveJurors: canApprove,
        submitUrl:urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.cannot-approve.post'),
          urlBuilder(dateFilters, currentTab)
        ),
        cancelUrl: urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.get'),
          urlBuilder(dateFilters, currentTab)
        ),
      });
    };
  };

  module.exports.postCannotApprove = function(app) {
    return function(req, res) {
      req.session.approveExpenses.checkedJurors = req.session.approveExpenses.checkedJurors.filter(j => j.canApprove);
      return sendApprovalRequest(app, req, res);
    };
  };

  module.exports.postFilterByDate = function(app) {
    return function(req, res) {
      const validateFilter = validate(req.body, approveExpensesFilterValidation());

      if (typeof validateFilter !== 'undefined') {
        req.session.fromFields = _.cloneDeep(req.body);
        req.session.errors = validateFilter;

        return res.redirect(urljoin(
          app.namedRoutes.build('juror-management.approve-expenses.get'),
          urlBuilder({}, req.body.currentTab))
        );
      }

      const from = dateFilter(req.body.filterStartDate, 'DD/MM/YYYY', 'yyyy-MM-DD');
      const to = dateFilter(req.body.filterEndDate, 'DD/MM/YYYY', 'yyyy-MM-DD');
      const redirectUrl = urljoin(
        app.namedRoutes.build('juror-management.approve-expenses.get'),
        urlBuilder({from, to}, req.body.currentTab));

      return res.redirect(redirectUrl);
    };
  };

  module.exports.getViewExpenses = function(app) {
    return async function(req, res){
      const { jurorNumber, locCode, status } = req.params;

      return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
        jurorNumber,
        locCode,
        status,
      }));
    };
  };

  async function sendApprovalRequest(app, req, res) {
    const currentTab = req.query.tab || 'BACS';
    const dateFilters = {
      from: req.query.from || '',
      to: req.query.to || '',
    };
    const redirectUrl = urljoin(
      app.namedRoutes.build('juror-management.approve-expenses.get'),
      urlBuilder(dateFilters, currentTab)
    );
    const checkedJurors = _.clone(req.session.approveExpenses.checkedJurors);
    const locCode = req.session.authentication.locCode;

    delete req.session.approveExpenses.checkedJurors;

    const payload = [];

    try {
      await approveExpensesDAO.get(
        app,
        req,
        locCode,
        currentTab,
        dateFilters,
        req.session.approveExpensesEtag
      );

      // TODO: update error message content once confirmed
      req.session.errors = {
        approveExpenses: [{
          summary: 'Expenses were updated or some have already been approved',
          details: 'Expenses were updated or some have already been approved',
        }],
      };

      return res.redirect(redirectUrl);

    } catch (err) {
      if (err.statusCode !== 304) {

        app.logger.crit('Failed to compare etags for when approving expenses: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            expenses: checkedJurors,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }
    }

    checkedJurors.forEach(j => {
      payload.push({
        jurorNumber: j.jurorNumber,
        poolNumber: j.poolNumber,
        approvalType: j.expenseType,
        isCashPayment: currentTab === 'CASH',
        revisions: j.revisions,
      });
    });

    replaceAllObjKeys(payload, _.snakeCase);

    try {
      const financialNumbers = await approveExpensesDAO.post(app, req, locCode, currentTab, payload);

      req.session.bannerMessage = `Expenses approved for ${checkedJurors.length > 1
        ? `${checkedJurors.length} jurors`
        : `${checkedJurors[0].firstName} ${checkedJurors[0].lastName}`
      }`;

      return res.render('reporting/reprint-audit-report/print-redirect', {
        completeRoute: redirectUrl,
        printRoute: app.namedRoutes.build('reports.financial-audit.bulk.get') + `?auditNumbers=${financialNumbers}`,
      });
    } catch (err) {

      app.logger.crit('Unable to approve selected expenses', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      if (err.statusCode === 422) {
        req.session.errors = {
          selectedJurors: [{
            details: err.error.message,
          }],
        };
        return res.redirect(redirectUrl);
      }

      return res.render('_errors/generic.njk');
    }
  }

  function urlBuilder(params, currentTab) {
    const parameters = [];

    parameters.push('tab=' + currentTab);

    if (params.from) {
      parameters.push('from=' + params.from);
    }
    if (params.to) {
      parameters.push('to=' + params.to);
    }

    return  '?' + parameters.join('&');
  };

})();
