(function() {
  'use strict';
  const _ = require('lodash');
  const { mapAdminToPoolRequestCourts, transformCourtName } = require('../../../lib/mod-utils');
  const { courtsDAO } = require('../../../objects/administration');

  module.exports.getCourtsAndBureau = function(app) {
    return async(req, res) => {
      let courts = [];
      let { filter, action } = req.query;

      if (action === 'clear') {
        delete req.session.courtsAndBureau;
      }

      try {
        if (req.session.courtsAndBureau && req.session.courtsAndBureau.filteredCourts && filter) {
          courts = _.clone(req.session.courtsAndBureau.filteredCourts);
        } else {
          const courtsData = await courtsDAO.get(app, req);

          courts = mapAdminToPoolRequestCourts(courtsData);

          req.session.courtsAndBureau = {
            courts: courts,
          };
        }

        return res.render('administration/courts-and-bureau.njk', {
          courts,
          filter,
          filterUrl: app.namedRoutes.build('administration.courts-and-bureau.filter'),
          clearFilterUrl: app.namedRoutes.build('administration.courts-and-bureau.get') + '?action=clear',
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
        delete req.session.courtsAndBureau;
        return res.redirect(app.namedRoutes.build('administration.courts-and-bureau.get'));
      }
      const courts = _.clone(req.session.courtsAndBureau.courts);

      const filteredList = courts.filter((court) =>{
        const courtName = transformCourtName(court).toLowerCase();

        return courtName.includes(req.body.courtSearch.toLowerCase());
      });

      req.session.courtsAndBureau.filteredCourts = filteredList;
      return res.redirect(app.namedRoutes.build('administration.courts-and-bureau.get') + '?filter=' + req.body.courtSearch);
    };
  };

})();
