(function() {
  'use strict';
  const _ = require('lodash');
  const { mapAdminToPoolRequestCourts, transformCourtName } = require('../../../lib/mod-utils');
  const { courtsDAO } = require('../../../objects/administration');

  module.exports.getCourtsAndBureau = function(app) {
    return async(req, res) => {
      let courts = [];
      let { filter } = req.query;

      try {
        let courtsData = await courtsDAO.get(req);

        courts = mapAdminToPoolRequestCourts(courtsData);

        if (filter) {
          courts = courts.filter((court) =>{
            const courtName = transformCourtName(court).toLowerCase();

            return courtName.includes(filter.toLowerCase());
          });
        }

        return res.render('administration/courts-and-bureau.njk', {
          courts,
          filter,
          filterUrl: app.namedRoutes.build('administration.courts-and-bureau.filter'),
          clearFilterUrl: app.namedRoutes.build('administration.courts-and-bureau.get'),
        });
      } catch (err) {
        app.logger.crit('Failed to fetch all courts', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.redirect('_errors/generic');
      }
    };
  };

  module.exports.postFilterCourts = function(app) {
    return async function(req, res) {
      if (req.body.courtSearch === '') {
        return res.redirect(app.namedRoutes.build('administration.courts-and-bureau.get'));
      }
      return res.redirect(app.namedRoutes.build('administration.courts-and-bureau.get') + '?filter=' + req.body.courtSearch);
    };
  };

})();
