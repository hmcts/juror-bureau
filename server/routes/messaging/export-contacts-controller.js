(function() {
  'use strict';

  module.exports.getExportContacts = function(app) {
    return function(req, res) {
      delete req.session.messaging;

      return res.render('messaging/export-contact-details.njk', {
        nav: 'export',
      });
    };
  };
})();
