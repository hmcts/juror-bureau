const _ = require('lodash');
const { validate } = require('validate.js');
const validator = require('../../../../config/validation/report-search-by');
const { dateFilter } = require('../../../../components/filters');

(function() {
  'use strict';

  module.exports.getPostponedSearch = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('reporting/standard-reports/search-by/postponed.njk', {
        processUrl: app.namedRoutes.build('postponed.search.post'),
        cancelUrl: app.namedRoutes.build('reports.get'),
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
      let validatorResult = validate(req.body, validator.postponed.searchBy());

      console.log(validatorResult);

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('postponed.search.get'));
      }

      console.log(req.body);

      if (req.body.searchBy === 'customDateRange') {
        validatorResult = validate(req.body, validator.postponed.dateRange());

        console.log(validatorResult);


        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('postponed.search.get'));
        }
      }

      switch (req.body.searchBy) {
      case 'poolNumber':
        return res.redirect(app.namedRoutes.build('postponed-pool.filter.get'));
      case 'next31Days':
        return res.redirect(app.namedRoutes.build('postponed-date.report.get', {filter: 'dateRange'})
          + `?fromDate=${dateFilter(new Date(), null, 'YYYY-MM-DD')}`
          + `&toDate=${dateFilter(new Date(new Date().setDate(new Date().getDate() + 31)), null, 'YYYY-MM-DD')}`); ;
      case 'customDateRange':
        return res.redirect(app.namedRoutes.build('postponed-date.report.get', {filter: 'dateRange'})
          + `?fromDate=${dateFilter(req.body.dateFrom, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
          + `&toDate=${dateFilter(req.body.dateTo, 'DD/MM/YYYY', 'YYYY-MM-DD')}`);
      }

      return res.redirect(app.namedRoutes.build('postponed.search.get'));
    };
  };

})();
