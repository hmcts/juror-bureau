(function() {
  'use strict';

  const _ = require('lodash');

  module.exports.getExportContacts = function(app) {
    return function(req, res) {
      delete req.session.messaging;

      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      return res.render('messaging/export-contact-details.njk', {
        nav: 'export',
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

      if (!searchBy || searchBy === '') {
        req.session.errors = {
          searchBy: [{
            details: 'Select how you want to search for contact details',
            summary: 'Select how you want to search for contact details',
          }],
        };

        return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
      }

      return res.redirect(app.namedRoutes.build('messaging.export-contacts.get'));
    };
  };

})();
