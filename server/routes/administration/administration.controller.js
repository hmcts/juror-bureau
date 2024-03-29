const { isBureauUser, isBureauManager } = require('../../components/auth/user-type');

(function() {
  'use strict';

  module.exports.getAdministration = function(app) {
    return async function(req, res) {
      if (isBureauUser(req, res)){
        if (isBureauManager(req, res)) {
          return res.redirect(app.namedRoutes.build('administration.court-bureau.users.get', { location: 'bureau' }));
        }
        return res.redirect(app.namedRoutes.build('administration.system-codes.get'));
      }
      return res.redirect(app.namedRoutes.build('administration.users.get'));
    };
  };

})();
