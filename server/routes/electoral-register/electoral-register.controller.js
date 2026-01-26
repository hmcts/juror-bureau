(() => {
  'use strict';

  module.exports.getDashboard = function(app) {
    return async function(req, res) {
      return res.render('electoral-register/dashboard.njk');
    };
  };

})();
