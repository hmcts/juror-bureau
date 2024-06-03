(function() {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const validator = require('../../../config/validation/report-search-by');
  const { dateFilter } = require('../../../components/filters');

  module.exports.getDeferredListSearch = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('reporting/deferred-list/list-by.njk', {
        processUrl: app.namedRoutes.build(`reports.deferred-list.filter.post`),
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

  module.exports.postDeferredListSearch = function(app) {
    return function(req, res) {
      let validatorResult = validate(req.body, validator.searchBy('deferredList'));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.deferred-list.filter.get`));
      }

      switch (req.body.searchBy) {
      case 'date':
        return res.redirect(app.namedRoutes.build('reports.deferred-list-date.report.get', {filter: 'date'}));
      case 'court':
        return res.redirect(app.namedRoutes.build('reports.deferred-list-court.report.get', {filter: 'court'}))
      default:
        return res.redirect(app.namedRoutes.build('reports.deferred-list.filter.get'));
      }
    };
  };

})();
