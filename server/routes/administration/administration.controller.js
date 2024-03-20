(function() {
  'use strict';

  module.exports.getAdministration = function(app) {
    return async function(req, res) {
      return res.redirect(app.namedRoutes.build('administration.users.get'));
    };
  };

})();
