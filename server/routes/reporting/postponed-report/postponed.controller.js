(function() {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const validator = require('../../../config/validation/report-search-by');
  const { dateFilter } = require('../../../components/filters');
  const moment = require('moment');

  module.exports.getPostponedSearch = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('reporting/standard-reports/search-by/postponed.njk', {
        processUrl: app.namedRoutes.build('reports.postponed.search.post'),
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

  module.exports.postPostponedSearch = function(app) {
    return function(req, res) {
      let validatorResult = validate(req.body, validator.searchBy('postponed'));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('reports.postponed.search.get'));
      }

      if (req.body.searchBy === 'customDateRange') {
        validatorResult = validate(req.body, validator.dateRange('postponed'));
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('reports.postponed.search.get'));
        }
        const fromDate = moment(req.body.dateFrom, 'DD/MM/YYYY');
        const toDate = moment(req.body.dateTo, 'DD/MM/YYYY');

        if (toDate.isBefore(fromDate)) {
          req.session.errors = {
            dateTo: [{
              summary: '‘Date to’ cannot be before ‘date from’',
              details: '‘Date to’ cannot be before ‘date from’',
            }],
          };
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build('reports.postponed.search.get'));
        }
      }

      switch (req.body.searchBy) {
      case 'poolNumber':
        return res.redirect(app.namedRoutes.build('reports.postponed-pool.filter.get'));
      case 'next31Days':
        return res.redirect(app.namedRoutes.build('reports.postponed-date.report.get', {filter: 'dateRange'})
          + `?fromDate=${dateFilter(new Date(), null, 'YYYY-MM-DD')}`
          + `&toDate=${dateFilter(new Date(new Date().setDate(new Date().getDate() + 31)), null, 'YYYY-MM-DD')}`); ;
      case 'customDateRange':
        return res.redirect(app.namedRoutes.build('reports.postponed-date.report.get', {filter: 'dateRange'})
          + `?fromDate=${dateFilter(req.body.dateFrom, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
          + `&toDate=${dateFilter(req.body.dateTo, 'DD/MM/YYYY', 'YYYY-MM-DD')}`);
      default:
        return res.redirect(app.namedRoutes.build('reports.postponed.search.get'));
      }
    };
  };

})();
