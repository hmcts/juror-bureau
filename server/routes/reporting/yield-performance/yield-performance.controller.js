const { makeManualError } = require('../../../lib/mod-utils');

(function() {
  'use strict';

  const _ = require('lodash');
  const { reportKeys } = require('../standard-report/definitions');
  const { validate } = require('validate.js');
  const validator = require('../../../config/validation/report-search-by');
  const { dateFilter } = require('../../../components/filters');
  const moment = require('moment');

  module.exports.getAttendanceDates = function(app) {
    return function(req, res) {
      const reportType = reportKeys(app, req)['yield-performance'];
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
        reportKey: 'yield-performance',
        title: reportType.title,
        isFixedDateRange: true,
        fixedDateRangeValues: ['NEXT_MONDAY', 'CUSTOM_RANGE'],
        searchLabels: reportType.searchLabelMappers,
        reportUrl: app.namedRoutes.build(`reports.yield-performance.filter.dates.post`),
        cancelUrl: app.namedRoutes.build('reports.reports.get'),
      });
    };
  };

  module.exports.postAttendanceDates = function(app) {
    return function(req, res) {
      const reportKey = 'yield-performance'
      const reportType = reportKeys(app, req)[reportKey];

      if (!req.body.dateRange) {
        req.session.errors = makeManualError('dateRange', 'Select whether you want to select next Monday or enter a custom date range');
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.dates.get`));
      }

      if (req.body.dateRange && req.body.dateRange === 'NEXT_MONDAY') {
        let nextMon = new Date();
        nextMon.setDate(nextMon.getDate() + (((1 + 7 - nextMon.getDay()) % 7) || 7));
        req.body.dateFrom = dateFilter(nextMon, null, 'DD/MM/YYYY');
        req.body.dateTo = dateFilter(nextMon, null, 'DD/MM/YYYY');
      }

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

      return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`)
        + `?fromDate=${dateFilter(req.body.dateFrom, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
        + `&toDate=${dateFilter(req.body.dateTo, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
      );
    };
  };

})();