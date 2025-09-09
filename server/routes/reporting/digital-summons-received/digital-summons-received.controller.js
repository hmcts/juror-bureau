(() => {
  'use strict';

  const { makeManualError } = require('../../../lib/mod-utils');
  const { dateFilter, capitalizeFully } = require('../../../components/filters');
  const { courtDetailsDAO } = require('../../../objects');
  const { monthlyUtilisationReportsDAO } = require('../../../objects/reports');

  module.exports.getDigitalSummonsReportMonth = (app) => (req, res) => {
    const errors = req.session.errors || {};
    const tmpBody = req.session.formFields || {};

    delete req.session.errors;
    delete req.session.formFields;

    return res.render('reporting/standard-reports/month-select', {
      months: generateSelectMonths(),
      reportName: 'Digital summons receieved',
      selectMonthLabel: 'Select month to view digital summons received for',
      processUrl: app.namedRoutes.build('reports.digital-summons-received.filter.post'),
      cancelUrl: app.namedRoutes.build('reports.reports.get'),
      tmpBody,
      errors: {
        title: 'Please check your search',
        count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
        items: errors,
      },

    });
  };

  module.exports.postDigitalSummonsReportMonth = (app) => (req, res) => {
    if (!req.body.selectMonth) {
      req.session.formFields = req.body;
      req.session.errors = makeManualError('selectMonth', 'Select a month to view digital summons received for');
      return res.redirect(app.namedRoutes.build('reports.digital-summons-received.filter.get'));
    }

    return res.redirect(app.namedRoutes.build('reports.digital-summons-received.report.get', { filter: req.body.selectMonth }));
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
