(() => {
  'use strict';

  const { makeManualError } = require('../../../lib/mod-utils');
  const { dateFilter, capitalizeFully } = require('../../../components/filters');
  const { courtDetailsDAO } = require('../../../objects');

  module.exports.getPrepareMonthlyUtilisation = (app) => (req, res) => {
    const errors = req.session.errors || {};
    const tmpBody = req.session.formFields || {};

    delete req.session.errors;
    delete req.session.formFields;

    return res.render('reporting/monthly-utilisation/prepare-select-month', {
      months: generateSelectMonths(),
      processUrl: app.namedRoutes.build('reports.prepare-monthly-utilisation.filter.post'),
      cancelUrl: app.namedRoutes.build('reports.statistics.get'),
      tmpBody,
      errors: {
        title: 'Please check your search',
        count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
        items: errors,
      },

    });
  };

  module.exports.postPrepareMonthlyUtilisation = (app) => (req, res) => {
    if (!req.body.selectMonth) {
      req.session.formFields = req.body;
      req.session.errors = makeManualError('selectMonth', 'Select a month to prepare report for');
      return res.redirect(app.namedRoutes.build('reports.prepare-monthly-utilisation.filter.get'));
    }

    return res.redirect(app.namedRoutes.build('reports.prepare-monthly-utilisation.confirm.get', {
      reportDate: req.body.selectMonth,
    }));
  };

  module.exports.getCofirmPrepareMonthlyUtilisation = (app) => async(req, res) => {
    const { reportDate } = req.params;

    try {
      const {response} = await courtDetailsDAO.get(app, req, req.session.authentication.locCode);
      const courtName = capitalizeFully(response.english_court_name);

      return res.render('reporting/monthly-utilisation/confirm-prepare', {
        courtName,
        month: dateFilter(reportDate, 'yyyy-MM-DD', 'MMMM YYYY'),
        incompleteServiceReportUrl: app.namedRoutes.build('reports.incomplete-service.filter.get'),
        continueUrl: app.namedRoutes.build('reports.prepare-monthly-utilisation.report.get', { filter: reportDate }),
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

    return res.render('reporting/monthly-utilisation/view-select-month', {
      months: generateSelectMonths(),
      processUrl: app.namedRoutes.build('reports.view-monthly-utilisation.filter.post'),
      cancelUrl: app.namedRoutes.build('reports.statistics.get'),
      tmpBody,
      errors: {
        title: 'Please check your search',
        count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
        items: errors,
      },
    });
  };

  module.exports.postFilterMonthlyUtilisation = (app) => (req, res) => {
    if (!req.body.selectMonth) {
      req.session.formFields = req.body;
      req.session.errors = makeManualError('selectMonth', 'Select a reporting month');
      return res.redirect(app.namedRoutes.build('reports.view-monthly-utilisation.filter.get'));
    }

    return res.redirect(app.namedRoutes.build('reports.view-monthly-utilisation.report.get', {
      filter: req.body.selectMonth,
    }) + `${req.body.previousMonths ?'?previousMonths=true' : ''}`);
  };

  function generateSelectMonths() {
    const months = [];
    let d = new Date();

    d.setDate(1);
    for (let i=0; i<=11; i++) {
      months.push({
        value: dateFilter(d, null, 'yyyy-MM-DD'),
        text: dateFilter(d, null, 'MMMM yyyy'),
      });
      d.setMonth(d.getMonth() - 1);
    }

    return months;
  };

})();
