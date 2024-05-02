const { makeManualError, mapSnakeToCamel } = require('../../lib/mod-utils');
const { render } = require('../../lib/reports/financial-audit');
const { generateDocument } = require('../../lib/reports/single-generator');
const { record } = require('../../objects');
const rp = require('request-promise');
const { jurorBankDetailsDAO, defaultExpensesDAO } = require('../../objects/expenses');
const { getDraftExpensesDAO } = require('../../objects/expense-record');

(() => {
  'use strict';

  const { financialAuditDAO } = require('../../objects/reports');

  const financialAudit = (app) => async(req, res) => {
    try {
      const auditData = await financialAuditDAO.get(req, req.params.auditNumber);

      console.log('got audit');
      console.log(JSON.stringify(auditData, null, 2));
      // console.log(JSON.stringify(render(auditData), null, 2));

      const document = await generateDocument(render(auditData), {pageOrientation: 'landscape'});

      res.contentType('application/pdf');
      return res.send(document);
    } catch (err) {
      console.log('in error');
      console.log(err);
      app.logger.crit('Failed to render financial audit', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }
  };

  const postDraftAudit = (app) => async(req, res) => {
    if (!req.body['checked-expenses']) {
      req.session.errors = makeManualError('select', 'Select at least one day to view a draft financial audit');

      return res.redirect(app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.post', {
        jurorNumber: req.params.jurorNumber,
        locCode: req.params.locCode,
        status: 'draft',
      }));
    }

    if (Array.isArray(req.body['checked-expensese'])) {
      req.session.draftExpenses = req.body['checked-expenses'];
    } else {
      req.session.draftExpenses = [req.body['checked-expenses']];
    }

    return res.render('reporting/draft-audit', {
      completeRoute: app.namedRoutes.build('juror-management.unpaid-attendance.expense-record.post', {
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
        app, req,
        req.params.jurorNumber,
        req.params.locCode,
      ));
      const jurorDetails = mapSnakeToCamel(await record.get(rp, app,
        req.session.authToken,
        'overview',
        req.params.jurorNumber,
        req.session.locCode
      )).data.commonDetails;
      const jurorBank = mapSnakeToCamel(await jurorBankDetailsDAO.get(
        app, req,
        req.params.jurorNumber
      )).response;
      const jurorDefault = mapSnakeToCamel(await defaultExpensesDAO.get(
        app, req,
        req.params.locCode,
        req.params.jurorNumber
      ));

      const filteredExpenses = expenses.response.expenseDetails.filter(item =>
        req.session.draftExpenses.indexOf(item.attendanceDate) > -1
      );

      const totalExpenses = filteredExpenses.reduce((prev, curr) => {
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
        auditType: 'FOR_APPROVAL',
        jurorDetails: {
          jurorNumber: jurorDetails.jurorNumber,
          name: {
            title: jurorDetails.title,
            firstName: jurorDetails.firstName,
            lastName: jurorDetails.lastName,
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
        },
        expenses: {
          expenseDetails: filteredExpenses,
          total: totalExpenses,
        },
        mileage: jurorDefault.mileage,
      };

      req.session.draftExpenses;

      delete req.session.draftExpense;
      console.log(JSON.stringify(audit, null, 2));

      const document = await generateDocument(render(audit), {pageOrientation: 'landscape'});

      res.contentType('application/pdf');
      return res.send(document);
    } catch (err) {
      console.log(err);
      app.logger.crit('Failed to render draft financial audit', {
        auth: req.session.authentication,
        token: req.session.authToken,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }
  };

  module.exports = {
    financialAudit,
    getDraftAudit,
    postDraftAudit,
  };
})();
