(() => {
  'use strict';

  const { makeManualError } = require('../../../lib/mod-utils');
  const { dateFilter } = require('../../../components/filters');

  module.exports.getPrepareMonthlyUtilisation = (app) => (req, res) => {
    const errors = req.session.errors || {};
    const tmpBody = req.session.formFields || {};

    delete req.session.errors;
    delete req.session.formFields;

    // HOW DO WE KNOW WHAT MONTHS TO DISPLAY

    return res.render('reporting/monthly-utilisation/prepare-select-month', {
      errors: {
        title: 'Please check your search',
        count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
        items: errors,
      },
      tmpBody,
      processUrl: app.namedRoutes.build('reports.monthly-utilisation.prepare.post'),
      cancelUrl: app.namedRoutes.build('reports.statistics.get'),
    });
  };

  module.exports.postPrepareMonthlyUtilisation = (app) => (req, res) => {
    if (!req.body.selectMonth) {
      req.session.formFields = req.body;
      req.session.errors = makeManualError('selectMonth', 'Select a month to prepare report for');
      return res.redirect(app.namedRoutes.build('reports.monthly-utilisation.prepare.get'));
    }

    return res.redirect(app.namedRoutes.build('reports.monthly-utilisation.prepare.confirm.get', {
      month: req.body.selectMonth,
    }));
  };

  module.exports.getCofirmPrepareMonthlyUtilisation = (app) => async(req, res) => {
    const { month } = req.params;

    try {
      // GET FULL COURT NAME

      return res.render('reporting/monthly-utilisation/confirm-prepare', {
        courtName: 'Chester Crown Court',
        month: dateFilter(`01-${month}`, 'MM-YYYY', 'MMMM YYYY'),
        incompleteServiceReportUrl: app.namedRoutes.build('reports.incomplete-service.filter.get'),
        continueUrl: app.namedRoutes.build('reports.monthly-utilisation.prepare.get'),
        cancelUrl: app.namedRoutes.build('reports.statistics.get'),
      });
    } catch (e) {
      console.log(e);
    }
  };

  module.exports.getFilterMonthlyUtilisation = (app) => (req, res) => {
    const errors = req.session.errors || {};
    const tmpBody = req.session.formFields || {};

    delete req.session.errors;
    delete req.session.formFields;

    // HOW DO WE KNOW WHAT MONTHS TO DISPLAY

    return res.render('reporting/monthly-utilisation/view-select-month', {
      errors: {
        title: 'Please check your search',
        count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
        items: errors,
      },
      tmpBody,
      processUrl: app.namedRoutes.build('reports.monthly-utilisation.filter.post'),
      cancelUrl: app.namedRoutes.build('reports.statistics.get'),
    });
  };

  module.exports.postFilterMonthlyUtilisation = (app) => (req, res) => {
    if (!req.body.selectMonth) {
      req.session.formFields = req.body;
      req.session.errors = makeManualError('selectMonth', 'Select a reporting month');
      return res.redirect(app.namedRoutes.build('reports.monthly-utilisation.filter.get'));
    }

    return res.redirect(app.namedRoutes.build('reports.monthly-utilisation.report.get', {
      filter: req.body.selectMonth,
    }) + `?monthsPrior=${req.body['2MonthsBefore'] || 'false'}`);
  };

})();
