(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const {
    exportContactDetailsValidator,
    detailsToExportValidator,
  } = require('../../config/validation/export-contact-details');
  const { fetchAllCourts } = require('../../objects/request-pool');
  const { transformCourtNames } = require('../../lib/mod-utils');

  module.exports.getExportContacts = function(app) {
    return async function(req, res) {
      let courtsResponse;
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.messaging;
      delete req.session.errors;

      try {
        courtsResponse = await fetchAllCourts.get(require('request-promise'), app, req.session.authToken);
      } catch (err) {
        app.logger.crit('Failed to fetch all courts', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        // set it to be empty so that the page can still be rendered
        courtsResponse = {
          courts: [],
        };
      }

      return res.render('messaging/export-contact-details/find-contact-details.njk', {
        nav: 'export',
        courts: transformCourtNames(courtsResponse.courts),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postExportContacts = function(app) {
    return function(req, res) {
      const { searchBy } = req.body;

      const validatorResult = validate(req.body, exportContactDetailsValidator(req.body));

      if (validatorResult) {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      const postUrl = app.namedRoutes.build('messaging.export-contacts.jurors.get');
      let queryParams;

      switch (searchBy) {
      case 'juror':
        queryParams = `?search_by=juror&juror_number=${req.body.jurorNumber}`;
        break;
      case 'pool':
        queryParams = `?search_by=pool&pool_number=${req.body.poolNumber}`;
        break;
      case 'court':
        queryParams = `?search_by=court&court_name=${req.body.courtName}`;
        break;
      }

      return res.redirect(postUrl + queryParams);
    };
  };

  module.exports.getJurorsList = function(app) {
    return function(req, res) {
      const {
        search_by: searchBy,
        juror_number: jurorNumber,
        pool_number: poolNumber,
        court,
        date_deferred_to: dateDeferredTo,
      } = req.query;
      const isEmpty = v => !v || v === '';

      // eslint-disable-next-line max-len
      if (isEmpty(searchBy) || (isEmpty(jurorNumber) && isEmpty(poolNumber) && isEmpty(court) && isEmpty(dateDeferredTo))) {
        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      return res.render('messaging/export-contact-details/jurors-list.njk', {
        origin: 'EXPORT_DETAILS',
        totalJurors: 20,
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('messaging.export-contacts.get'),
        },
      });
    };
  };

  module.exports.getSelectDetailsToExport = function() {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      return res.render('messaging/export-contact-details/details-to-export.njk', {
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postSelectDetailsToExport = function(app) {
    return function(req, res) {
      const validatorResult = validate(req.body, detailsToExportValidator());

      if (validatorResult) {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
      }

      return res.redirect(app.namedRoutes.build('messaging.export-contacts.details-to-export.get'));
    };
  };

})();
