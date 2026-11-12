(function() {
  'use strict';
  const _ = require('lodash');
  const { mapAdminToPoolRequestCourts, transformCourtName } = require('../../../lib/mod-utils');
  const { courtsDAO } = require('../../../objects/administration');
  const { validateQueryParam, makeManualError } = require('../../../lib/mod-utils');

  module.exports.getCourtsAndBureau = function(app) {
    return async(req, res) => {
      let courts = [];
      let { filter } = req.query;

      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);
      delete req.session.errors;
      delete req.session.formFields;

      try {
        let courtsData = await courtsDAO.get(req);

        courts = mapAdminToPoolRequestCourts(courtsData);

        if (filter) {
          courts = courts.filter((court) =>{
            const courtName = transformCourtName(court).toLowerCase();

            return courtName.includes(filter.toLowerCase());
          });
        }

        app.logger.info('Fetched all courts admin court selection screen', {
          auth: req.session.authentication,
          filter: filter || '',
        });

        return res.render('administration/courts-and-bureau.njk', {
          courts,
          filter,
          filterUrl: app.namedRoutes.build('administration.courts-and-bureau.filter'),
          clearFilterUrl: app.namedRoutes.build('administration.courts-and-bureau.get'),
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch all courts', {
          auth: req.session.authentication,
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

      if (!/^[a-z0-9]+$/i.test(req.body.courtSearch)) {
        req.session.errors = makeManualError('courtSearch', 'Court name or location code must only contain alphanumeric characters');
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('administration.courts-and-bureau.get'));
      }

      const filter = validateQueryParam(req, res, `?courtSearch=${req.body.courtSearch}`);
      if (!filter) {
        return;
      }

      return res.redirect(app.namedRoutes.build('administration.courts-and-bureau.get') + '?filter=' + filter);
    };
  };

})();
