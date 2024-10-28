const { makeManualError } = require('../../../lib/mod-utils');
const { standardReportDAO, financialAuditDAO } = require('../../../objects');
const { standardReportPrint } = require('../standard-report/standard-report-print');

(function() {
  'use strict';

  const _ = require('lodash');
  const { reportKeys } = require('../standard-report/definitions');
  const { validate } = require('validate.js');
  const validator = require('../../../config/validation/report-search-by');
  const { dateFilter, capitalise } = require('../../../components/filters');

  module.exports.getReprintAuditReport = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('reporting/reprint-audit-report/find-report.njk', {
        processUrl: app.namedRoutes.build(`reports.reprint-audit-report.filter.post`),
        cancelUrl: app.namedRoutes.build('reports.reports.get'),
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postReprintAuditReport = function(app) {
    return async function(req, res) {
      const errorCB = (err) => {
        if (err.statusCode === 404 || err.statusCode === 400) {
          req.session.errors = makeManualError('auditReportNumber', 'No audit report found - check number and try again');
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('reports.reprint-audit-report.filter.get'));
        }
        app.logger.crit('Failed to render audit report', {
          auth: req.session.authentication,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });
  
        return res.render('_errors/generic');
      }

      if (!req.body.auditReportNumber) {
        req.session.errors = makeManualError('auditReportNumber', 'Enter an audit report number');
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('reports.reprint-audit-report.filter.get'));
      }

      const auditNumber = capitalise(req.body.auditReportNumber)

      let reportKey;
      switch (auditNumber.charAt(0)) {
      case 'F':
        try {
          await financialAuditDAO.get(req, auditNumber);

          req.session.formFields = req.body;
          
          return res.render('reporting/reprint-audit-report/print-redirect', {
            completeRoute: app.namedRoutes.build('reports.reprint-audit-report.filter.get'),
            printRoute: app.namedRoutes.build('reports.financial-audit.get', { 
              auditNumber,
            }),
          });
        } catch (err) {
          return errorCB(err);
        }
      case 'P':
        reportKey = 'pool-attendance-audit';
        break;
      case 'J':
        reportKey = 'jury-attendance-audit';
        break;
      default:
        return errorCB({ statusCode: 404 })
      }

      const reportType = reportKeys(app, req)[reportKey];

      let config = {
        reportType: reportType.apiKey,
        locCode: req.session.authentication.locCode
      };
      if (reportKey == 'jury-attendance-audit') {
        config.juryAuditNumber = auditNumber;
      } else if (reportKey == 'pool-attendance-audit') {
        config.poolAuditNumber = auditNumber;
      }

      try {
        await (reportType.bespokeReport?.dao
          ? reportType.bespokeReport.dao(req)
          : standardReportDAO.post(req, config));

        req.session.formFields = req.body;

        return res.render('reporting/reprint-audit-report/print-redirect', {
          completeRoute: app.namedRoutes.build('reports.reprint-audit-report.filter.get'),
          printRoute: app.namedRoutes.build(`reports.${reportKey}.report.print`, {
            filter: auditNumber,
          }),
        });
      } catch (err) {
        return errorCB(err);
      }
    };
  };

})();
