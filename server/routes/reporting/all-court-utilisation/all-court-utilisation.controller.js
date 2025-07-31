(() => {
  'use strict';

  const { makeManualError, transformCourtNames } = require('../../../lib/mod-utils');
  const { dateFilter, capitalizeFully } = require('../../../components/filters');
  const { courtDetailsDAO, fetchAllCourtsDAO } = require('../../../objects');
  const { monthlyUtilisationReportsDAO } = require('../../../objects/reports');

  module.exports.getSelectCourts = (app) => async (req, res) => {
    const errors = req.session.errors || {};
    const tmpBody = req.session.formFields || {};

    delete req.session.errors;
    delete req.session.formFields;

    if (!req.session.utilisationCourtsList) {
      try {
        req.session.utilisationCourtsList = (await fetchAllCourtsDAO.get(req)).courts;
      } catch (err) {
        app.logger.crit('Failed to fetch courts list: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.errors = modUtils.makeManualError('Courts list', 'Failed to fetch courts list');

        return res.redirect(app.namedRoutes.build('reports.all-court-utilisation.filter.select.get'));
      }
    }

    const transformedCourtNames = transformCourtNames(req.session.utilisationCourtsList);

    return res.render('reporting/all-court-utilisation/select-courts', {
      courts: transformedCourtNames,
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
