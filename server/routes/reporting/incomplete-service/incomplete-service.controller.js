const { dateFilter } = require('../../../components/filters');
const { genericDatePicker } = require('../../../config/validation/date-picker');

(() => {
  'use strict';

  const { validate } = require('validate.js');
  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.filterCutoffDateGet = (app) => (req, res) => {
    const errors = req.session.errors || {};
    const tmpBody = req.session.formFields || {};

    delete req.session.errors;
    delete req.session.formFields;

    return res.render('reporting/incomplete-service/cutoff-date', {
      errors: {
        title: 'Please check your search',
        count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
        items: errors,
      },
      tmpBody,
      processUrl: app.namedRoutes.build('reports.incomplete-service.filter.post'),
      cancelUrl: app.namedRoutes.build('reports.statistics.get'),
    });
  };

  module.exports.filterCutoffDatePost = (app) => (req, res) => {
    req.session.formFields = req.body;
    if (!req.body.searchBy) {
      req.session.errors = makeManualError('cutoff',
        'Select whether you want to use today as a cut off date or enter a custom date.');
    } else if (req.body.searchBy === 'customDate') {
      if (req.body.cutoff === '') {
        req.session.errors = makeManualError('date', 'Enter a cutoff date');
      } else {
        req.session.errors = validate({dateToCheck: req.body.cutoff}, genericDatePicker());
      }
    }

    if (req.session.errors) {
      return res.redirect(app.namedRoutes.build('reports.incomplete-service.filter.get'));
    }

    const targetDate = dateFilter(req.body.cutoff || new Date(), '', 'YYYY-MM-DD');

    return res.redirect(app.namedRoutes.build('reports.incomplete-service.report.get', {filter: targetDate}));
  };

  module.exports.getCompleteService = (app) => async(req, res) => {
    const { jurorNumber, lastAttendanceDate } = req.params;

    if (lastAttendanceDate) {
      req.session.completeServiceLastDate = lastAttendanceDate;
    }

    return res.redirect(app.namedRoutes.build('reports.incomplete-service.complete.get', { jurorNumber }));
  };

})();
