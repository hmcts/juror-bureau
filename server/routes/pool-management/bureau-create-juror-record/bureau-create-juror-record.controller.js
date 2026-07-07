(function(){
  'use strict';

  const { poolSummaryObject } = require("../../../objects/pool-summary");

  module.exports.index = function(app) {
    return async function(req, res) {
      const { poolNumber } = req.params;
      let pool;

      try {
        pool = (await poolSummaryObject.get(req, poolNumber)).poolDetails;
      } catch (err) {
        app.logger.crit('Failed to fetch pool details before creating a juror record:', {
          auth: req.session.authentication,
          data: {
            poolNumber
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

      // if user bypases the button and tries to access page directly
      // and the pool is not a nil pool, or the pool is not active, or the pool is not owned by the bureau
      // then redirect to the pool overview page
      if (pool.isNilPool || !pool.isActive || pool.currentOwner !== '400') {
        app.logger.crit('User cannot create and summon a juror to the pool:', {
          data: {
            poolNumber
          }
        });
        return res.redirect(app.namedRoutes.build('pool-overview.get', { poolNumber }))
      }

      req.session.newJuror = {
        poolNumber,
        courtLocCode: poolNumber.slice(0, 3),
      };
      return res.redirect(app.namedRoutes.build('bureau-create-juror-record.juror-name.get', { poolNumber }));
    };
  };

})();
