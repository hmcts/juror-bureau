(function() {
  'use strict';

  const _ = require('lodash');
  const { reportKeys } = require('../standard-report/definitions');
  const { validate } = require('validate.js');
  const validator = require('../../../config/validation/report-search-by');
  const { dateFilter } = require('../../../components/filters');
  const moment = require('moment');
  const { makeManualError } = require('../../../lib/mod-utils');
  const { addURLQueryParams } = require('../standard-report/standard-report.controller.js');
  const { fetchAllCourtsDAO } = require('../../../objects/request-pool.js');

  module.exports.getAttendanceDates = function(app) {
    return function(req, res) {
      const reportType = reportKeys(app, req)['outgoing-sms-messages'];
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('reporting/standard-reports/date-search', {
        errors: {
          title: 'Please check your search',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        tmpBody,
        reportKey: 'outgoing-sms-messages',
        title: reportType.title,
        searchLabels: reportType.searchLabelMappers,
        reportUrl: app.namedRoutes.build(`reports.outgoing-sms-messages.filter.dates.post`),
        cancelUrl: app.namedRoutes.build('reports.reports.get'),
      });
    };
  };

  module.exports.postAttendanceDates = function(app) {
    return function(req, res) {
      const reportKey = 'outgoing-sms-messages'
      const reportType = reportKeys(app, req)[reportKey];

      const validatorResult = validate(req.body, validator.dateRange(_.camelCase(reportKey), req.body));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.dates.get`));
      }
      const fromDate = moment(req.body.dateFrom, 'DD/MM/YYYY');
      const toDate = moment(req.body.dateTo, 'DD/MM/YYYY');

      if (toDate.isBefore(fromDate)) {
        req.session.errors = makeManualError('dateTo', '‘Date to’ cannot be before ‘date from’');
        req.session.formFields = req.body;
        return res.redirect(addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.filter.dates.get`)));
      }

      return res.redirect(app.namedRoutes.build('reports.outgoing-sms-messages.filter.post')
        + `?fromDate=${dateFilter(req.body.dateFrom, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
        + `&toDate=${dateFilter(req.body.dateTo, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
      );
    };
  };

  module.exports.getDashboardExportRedirect = function(app) {
    return async function(req, res) {
      const { fromDate, toDate } = req.query;
      try {
        const courtsData = await fetchAllCourtsDAO.get(req);
        const locCodes = courtsData.courts.map((court) => court.locationCode);
        req.session.reportCourts = locCodes;

        return res.redirect(app.namedRoutes.build('reports.outgoing-sms-messages.report.export', {
          filter: 'courts',
        }) + `?fromDate=${fromDate}&toDate=${toDate}`);
      } catch (err) {
        app.logger.crit('Failed to fetch courts list for sms management dashboard export: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  }

})();
