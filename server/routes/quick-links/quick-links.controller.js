(function() {
  'use strict';

  const { fetchCourtsDAO } = require('../../objects/index')
  const { clearPoolManagementSessionData } = require('../pool-management/pool-management.controller');

  module.exports.index = function(app, linkPath) {
    return async function(req, res) {

      clearPoolManagementSessionData(app, req);

      try {

        if (!req.session.courtsList?.length) { 
          const courtsData = await fetchCourtsDAO.get(req);
          req.session.courtsList = courtsData.courts;
        }

        return res.redirect(app.namedRoutes.build(linkPath));
 
      } catch (err) {
        app.logger.crit('Failed to fetch courts list', {
          auth: req.session.authentication,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
