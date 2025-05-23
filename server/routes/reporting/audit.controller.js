const { makeManualError, mapSnakeToCamel } = require('../../lib/mod-utils');
const { render } = require('../../lib/reports/financial-audit');
const { generateDocument } = require('../../lib/reports/single-generator');
const { jurorRecordDetailsDAO } = require('../../objects');
const { jurorBankDetailsDAO, defaultExpensesDAO } = require('../../objects/expenses');
const { getDraftExpensesDAO, getApprovalExpenseListDAO } = require('../../objects/expense-record');

(() => {
  'use strict';

  const { financialAuditDAO } = require('../../objects/reports');
  const statusToAuditType = {
    'draft': 'FOR_APPROVAL',
    'for-approval': 'FOR_APPROVAL_EDIT',
    'for-reapproval': 'REAPPROVED_EDIT',
    'approved': 'APPROVED_EDIT',
  };

  const financialAudit = (app) => async(req, res) => {
    try {
      const auditData = await financialAuditDAO.get(req, req.params.auditNumber);
      const document = await generateDocument(render(auditData), {pageOrientation: 'landscape'});

      res.contentType('application/pdf');
      return res.send(document);
    } catch (err) {
      if (req.session.reprintAuditReport) {
        req.session.errors = makeManualError('auditReportNumber', 'No audit report found - check number and try again');
        req.session.formFields = {
          auditReportNumber: req.params.auditNumber,
        };
        return res.redirect(app.namedRoutes.build('reports.reprint-audit-report.filter.get'));
      }
      app.logger.crit('Failed to render financial audit', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }
  };

  const makePreviewAudit = async(app, req, res, expenseDetails) => {
    const jurorDetails = mapSnakeToCamel(await jurorRecordDetailsDAO.post(req, [{
      'juror_number': req.params.jurorNumber,
      'juror_version': null,
      'include': ['NAME_DETAILS'],
    }]))['0'];
    const jurorBank = mapSnakeToCamel(await jurorBankDetailsDAO.get(
      req,
      req.params.jurorNumber
    )).response;
    const jurorDefault = mapSnakeToCamel(await defaultExpensesDAO.get(
      req,
      req.params.locCode,
      req.params.jurorNumber
    ));

    if (!jurorDetails || !jurorBank || !jurorDefault) {
      app.logger.crit('Failed to build and render financial audit preview: essential data is missing', {
        auth: req.session.authentication,
        data: {
          jurorDetails,
          jurorBank,
          jurorDefault,
        }
      });

      return res.render('_errors/generic');
    }

    const total = expenseDetails.reduce((prev, curr) => {
      const out = {};

      Object.keys(curr).forEach(key => {
        if (!Number.isNaN(curr[key])) {
          if (prev[key]) {
            out[key] = prev[key] + curr[key];
          } else {
            out[key] = curr[key];
          }
        }
      });

      return {
        ...prev,
        ...out,
      };
    }, {});

    const audit = {
      draft: true,
      auditType: statusToAuditType[req.params.status] || 'FOR_APPROVAL',
      jurorDetails: {
        jurorNumber: jurorDetails.jurorNumber,
        name: {
          title: jurorDetails.name.title,
          firstName: jurorDetails.name.firstName,
          lastName: jurorDetails.name.lastName,
        },
        paymentDetails: {
          sortCode: jurorBank.sortCode,
          bankAccountNumber: jurorBank.bankAccountNumber,
        },
        address: {
          lineOne: jurorBank.addressLine1,
          lineTwo: jurorBank.addressLine2,
          lineThree: jurorBank.addressLine3,
          town: jurorBank.addressLine4,
          county: jurorBank.addressLine5,
          postcode: jurorBank.postcode,
        },
        mileage: jurorDefault.mileage,
      },
      expenses: {
        expenseDetails,
        total
      },
    };

    delete req.session.draftExpense;

    const document = await generateDocument(render(audit), {pageOrientation: 'landscape'});

    res.contentType('application/pdf');
    return res.send(document);
  };

  const postEditAudit = (app) => async(req, res) => {
    if (!req.session.editedExpenses) {
      req.session.errors = makeManualError('data', 'No expenses have been updated to preview audit report.');

      return res.redirect(app.namedRoutes.build(
        'juror-management.edit-expense.get', {
          jurorNumber: req.params.jurorNumber,
          locCode: req.params.locCode,
          status: req.params.status,
        }));
    }

    return res.render('reporting/draft-audit', {
      completeRoute: app.namedRoutes.build(
        'juror-management.edit-expense.get', {
          jurorNumber: req.params.jurorNumber,
          locCode: req.params.locCode,
          status: req.params.status,
        }
      ),
      printRoute: app.namedRoutes.build('juror-management.edit-expense.preview.get', {
        jurorNumber: req.params.jurorNumber,
        locCode: req.params.locCode,
        status: req.params.status,
      }),
    });
  };

  const getEditAudit = (app) => async(req, res) => {
    try {
      const expenseDates = mapSnakeToCamel(req.session.editApprovalDates);
      const editedExpenses = mapSnakeToCamel(req.session.editedExpenses);
      const originalExpenses = mapSnakeToCamel(await getApprovalExpenseListDAO.post(
        req,
        req.params.locCode,
        req.params.jurorNumber,
        expenseDates,
      ));

      const expenseDetails = expenseDates.map(date => {
        const original = originalExpenses.expenseDetails.find(item => item.attendanceDate === date);

        if (editedExpenses[date]) {
          return {
            ...editedExpenses[date].tableData,
            original,
          };
        }

        return original;
      });

      return makePreviewAudit(app, req, res, expenseDetails);
    } catch (err) {
      app.logger.crit('Failed to render draft financial audit', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }
  };

  const postDraftAudit = (app) => async(req, res) => {
    if (!req.body['checked-expenses']) {
      req.session.errors = makeManualError('select', 'Select at least one day to view a draft financial audit');

      return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
        jurorNumber: req.params.jurorNumber,
        locCode: req.params.locCode,
        status: 'draft',
      }));
    }

    if (Array.isArray(req.body['checked-expenses'])) {
      req.session.draftExpenses = req.body['checked-expenses'];
    } else {
      req.session.draftExpenses = [req.body['checked-expenses']];
    }

    return res.render('reporting/draft-audit', {
      completeRoute: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.get', {
        jurorNumber: req.params.jurorNumber,
        locCode: req.params.locCode,
        status: 'draft',
      }),
      printRoute: app.namedRoutes.build('reports.draft-audit.get', {
        jurorNumber: req.params.jurorNumber,
        locCode: req.params.locCode,
      }),
    });
  };

  const getDraftAudit = (app) => async(req, res) => {
    try {
      const expenses = mapSnakeToCamel(await getDraftExpensesDAO.get(
        req,
        req.params.jurorNumber,
        req.params.locCode,
      )).response;

      const filteredExpenses = expenses.expenseDetails.filter(item =>
        req.session.draftExpenses.indexOf(item.attendanceDate) > -1
      );

      return makePreviewAudit(app, req, res, filteredExpenses);
    } catch (err) {
      app.logger.crit('Failed to render draft financial audit', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }
  };

  module.exports = {
    financialAudit,
    getDraftAudit,
    postDraftAudit,
    getEditAudit,
    postEditAudit,
  };
})();
