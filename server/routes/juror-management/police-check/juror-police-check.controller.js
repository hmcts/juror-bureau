(function() {
  'use strict';

  const { runPoliceCheckDAO } = require('../../../objects');

  module.exports.getRunPoliceCheck = function(app) {
    return function(req, res) {
      const { jurorNumber } = req.params;
      const processUrl = app.namedRoutes.build('juror-record.police-check.post', {
        jurorNumber,
      });
      const cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber,
      });

      return res.render('juror-management/run-police-check.njk', {
        jurorNumber,
        processUrl,
        cancelUrl,
      });
    };
  };

  module.exports.postRunPoliceCheck = function(app) {
    return function(req, res) {
      runPoliceCheckDAO.patch(req, req.params.jurorNumber)
        .then(() => {
          app.logger.info('Police check succesfully running: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
            },
          });

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        })
        .catch((err) => {
          app.logger.crit('Failed to run police check: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

})();

