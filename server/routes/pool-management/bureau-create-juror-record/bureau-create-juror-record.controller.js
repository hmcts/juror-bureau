(function(){
  'use strict';

  module.exports.index = function(app) {
    return function(req, res, next) {
      const { poolNumber } = req.params;
      req.session.newJuror = {
        poolNumber,
        courtLocCode: poolNumber.slice(0, 3),
      };
      return res.redirect(app.namedRoutes.build('bureau-create-juror-record.juror-name.get', { poolNumber }));
    };
  };

})();
