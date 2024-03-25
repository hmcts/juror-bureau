(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const exportContactDetailsValidator = require('../../config/validation/export-contact-details');
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
        // TODO: Handle error
        console.log(err);
      }

      return res.render('messaging/export-contact-details.njk', {
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
      const validatorResult = validate(req.body, exportContactDetailsValidator(req.body));

      if (validatorResult) {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
    };
  };

})();
