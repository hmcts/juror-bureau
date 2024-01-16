(function() {
  'use strict';

  module.exports.getReports = function() {
    return function(req, res) {

      return res.render('reporting/index.njk');
    };
  };

})();
