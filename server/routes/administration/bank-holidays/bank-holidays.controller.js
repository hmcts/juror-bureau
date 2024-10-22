(function() {
  'use strict';

  const { bankHolidaysDAO } = require('../../../objects/administration');

  module.exports.getBankHolidays = function(app) {
    return async function(req, res) {
      try {
        const bankHolidays = await bankHolidaysDAO.get(req);

        return res.render('administration/bank-holidays.njk', {
          bankHolidays,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch bank holidays', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
