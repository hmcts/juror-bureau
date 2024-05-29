(function() {
  'use strict';

  const _ = require('lodash');
  const { reportKeys } = require('../standard-report/definitions');
  const { validate } = require('validate.js');
  const validator = require('../../../config/validation/report-search-by');
  const { dateFilter } = require('../../../components/filters');

  module.exports.getAvailableListSearch = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('reporting/available-list/search-by.njk', {
        processUrl: app.namedRoutes.build(`reports.available-list.filter.post`),
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

  module.exports.postAvailableListSearch = function(app) {
    return function(req, res) {
      let validatorResult = validate(req.body, validator.searchBy('availableList'));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.available-list.filter.get`));
      }

      if (req.body.searchBy === 'attendanceDate') {
        validatorResult = validate(req.body, validator.date('availableList'));
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build(`reports.available-list.filter.get`));
        }
      }
      const includeOnCall = req.body.additionalOptions?.includes('onCall') || false;
      const respondedOnly = req.body.additionalOptions?.includes('respondedOnly') || false;
      const panelMembers = req.body.additionalOptions?.includes('panelMembers') || false;

      const queryString = `?includeJurorsOnCall=${includeOnCall}&respondedJurorsOnly=${respondedOnly}&includePanelMembers=${panelMembers}`


      switch (req.body.searchBy) {
      case 'poolNumber':
        return res.redirect(app.namedRoutes.build('reports.available-list-pool.filter.get') + queryString);
      case 'attendanceDate':
        return res.redirect(app.namedRoutes.build('reports.available-list-date.report.get', {filter: dateFilter(req.body.date, 'DD/MM/YYYY', 'yyyy-MM-DD')}) + queryString)
      default:
        return res.redirect(app.namedRoutes.build('reports.available-list.filter.get'));
      }
    };
  };

})();
