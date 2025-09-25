(() => {
  'use strict';

  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.getSelectCourts = (app) => async (req, res) => {
    const errors = req.session.errors || {};
    const tmpBody = req.session.formFields || {};

    delete req.session.errors;
    delete req.session.formFields;

    return res.render('reporting/all-court-utilisation/select-courts', {
      processUrl: app.namedRoutes.build('reports.all-court-utilisation.filter.select.post'),
      cancelUrl: app.namedRoutes.build('reports.statistics.get'),
      tmpBody,
      errors: {
        title: 'Please check your search',
        count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
        items: errors,
      },

    });
  };

  module.exports.postSelectCourts = (app) => (req, res) => {
    if (!req.body.courts) {
      req.session.formFields = req.body;
      req.session.errors = makeManualError('courts', 'Select courts to include in the report');
      return res.redirect(app.namedRoutes.build('reports.prepare-all-court-utilisation.filter.select.get'));
    }

    if (req.body.courts === 'all') {
       return res.redirect(app.namedRoutes.build('reports.all-court-utilisation.report.get', {
        filter: "all-courts",
       }));
    }

    return res.redirect(app.namedRoutes.build('reports.all-court-utilisation.filter.get'));

  };

})();
