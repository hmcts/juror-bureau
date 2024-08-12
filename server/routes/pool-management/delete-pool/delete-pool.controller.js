;(function() {
  'use strict';

  const deletePoolObject = require('../../../objects/delete-pool').deletePoolObject;
  const poolSummaryObj = require('../../../objects/pool-summary.js').poolSummaryObject;

  module.exports.index = function(app) {
    return async function(req, res) {
      const { poolNumber } = req.params;

      let confirmUrl = 'pool-management.delete-pool.post';
      let cancelUrl = '/pool-management/pool-overview/' + poolNumber;

      let members, isActive;
      try {
        const response = await poolSummaryObj.get(req, poolNumber);
        members = response.additionalStatistics.courtSupply + response.bureauSummoning.confirmed;
        isActive = response.poolDetails.isActive;
      } catch (err) {
        app.logger.crit('Failed to fetch pool summary (delete pool journey): ', {
          auth: req.session.authentication,
          data: { poolNumber },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }


      if (members === 0) {
        return res.render('pool-management/delete-pool/confirm', {
          poolNumber,
          confirmUrl: confirmUrl,
          cancelUrl: cancelUrl,
          isActive,
        });
      }

      if (members > 0) {
        return res.render('pool-management/delete-pool/has-members', {
          cancelUrl: cancelUrl,
          members,
          isActive,
        });
      }
    };
  };

  module.exports.postDeletePool = function(app) {
    return function(req, res) {
      const { poolNumber } = req.params;

      var successCB = function() {
          req.session.deletedRecord = {
            number: poolNumber,
          };

          app.logger.info('Successfully deleted pool: ', {
            auth: req.session.authentication,
            data: {
              poolNumber,
            },
          });

          return res.redirect(app.namedRoutes.build('pool-management.get'));
        }
        , errorCB = function(err) {
          var cancelUrl = '/pool-management/pool-overview/' + poolNumber;

          if (err.response.status === 423) {
            return res.render('pool-management/delete-pool/locked', {
              cancelUrl: cancelUrl,
            });
          }

          app.logger.crit('Failed to delete pool: ', {
            auth: req.session.authentication,
            data: {
              poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          // if for whatever reason the pool fails to get deleted we should display an error
          // ... just a generic error saying we couldn't process?
          req.session.deletePoolError = {
            message: 'Unable to delete pool',
            type: 'pool-delete-error',
          };

          return res.redirect('/pool-management/pool-overview/' + poolNumber);
        };

      deletePoolObject.delete(req, poolNumber)
        .then(successCB)
        .catch(errorCB);
    };
  };
})();
