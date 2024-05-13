(function() {
  'use strict';

  const _ = require('lodash');
  const { reportKeys } = require('../standard-report/definitions');
  const { validate } = require('validate.js');
  const validator = require('../../../config/validation/report-search-by');
  const { dateFilter } = require('../../../components/filters');

  module.exports.getFilterAttendanceDate = function(app) {
    return function(req, res) {
      const reportKey = req.url.split('reporting/')[1];
      const reportType = reportKeys(app, req)[reportKey];
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('reporting/persons-attending/attendance-date.njk', {
        title: reportType.title,
        processUrl: app.namedRoutes.build('reports.persons-attending-summary.filter.post'),
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

  module.exports.postFilterAttendanceDate = function(app) {
    return function(req, res) {
      const reportKey = req.url.split('reporting/')[1];
      let validatorResult = validate(req.body, validator.searchBy('personsAttending'));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
      }

      if (req.body.searchBy === 'otherDate') {
        validatorResult = validate(req.body, validator.date('personsAttending'));
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
        }
      }

      const includeSummoned = req.body.includeSummoned ? `?includeSummoned=${req.body.includeSummoned}` : '';

      switch (req.body.searchBy) {
      case 'today':
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, {
          filter: dateFilter(new Date(), null, 'YYYY-MM-DD'),
        }) + includeSummoned);
      case 'nextWorkingDay':
        const date = new Date();
        const day = date.getDay();
        let addDays = 1;

        if (day === 6) {
          addDays = 2;
        } else if (day === 5) {
          addDays = 3;
        }

        date.setDate(date.getDate() + addDays);
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, {
          filter: dateFilter(date, null, 'YYYY-MM-DD'),
        }) + includeSummoned);
      case 'otherDate':
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, {
          filter: dateFilter(req.body.date, null, 'YYYY-MM-DD'),
        }) + includeSummoned);
      default:
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
      }
    };
  };

})();
