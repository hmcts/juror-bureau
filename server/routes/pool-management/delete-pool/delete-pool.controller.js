const _ = require('lodash');
const deletePoolObject = require('../../../objects/delete-pool').deletePoolObject;

module.exports.index = function (app) {
  return function (req, res) {
    // req.session.poolDetails is already used in other journey/flow so if I use it here too
    //  I am sure it will get cleaned once the user goes back to 'pool-management.get'
    const pool = _.clone(req.session.poolDetails);
    const confirmUrl = 'pool-management.delete-pool.post';

    // if the user does not come from a pool-record we send them away
    if (typeof pool === 'undefined') {
      return res.redirect(app.namedRoutes.build('pool-management.get'));
    }

    const cancelUrl = '/pool-management/pool-overview/' + pool.poolDetails.poolNumber;
    const members = pool.additionalStatistics.courtSupply + pool.bureauSummoning.confirmed;

    if (members === 0) {
      return res.render('pool-management/delete-pool/confirm', {
        poolNumber: pool.poolDetails.poolNumber,
        confirmUrl: confirmUrl,
        cancelUrl: cancelUrl,
        isActive: pool.poolDetails.isActive,
      });
    }

    if (members > 0) {
      return res.render('pool-management/delete-pool/has-members', {
        cancelUrl: cancelUrl,
        members: members,
        isActive: pool.poolDetails.isActive,
      });
    }
  };
};

module.exports.postDeletePool = function (app) {
  return function (req, res) {
    const successCB = function () {
      req.session.deletedRecord = {
        number: req.session.poolDetails.poolDetails.poolNumber,
      };

      return res.redirect(app.namedRoutes.build('pool-management.get'));
    };
    const errorCB = function (err) {
      const cancelUrl = '/pool-management/pool-overview/' + req.session.poolDetails.poolDetails.poolNumber;

      if (err.response.status === 423) {
        return res.render('pool-management/delete-pool/locked', {
          cancelUrl: cancelUrl,
        });
      }

      app.logger.crit('Failed to delete pool: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          poolNumber: req.session.poolDetails.poolDetails.poolNumber,
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      // if for whatever reason the pool fails to get deleted we should display an error
      // ... just a generic error saying we couldn't process?
      req.session.deletePoolError = {
        message: 'Unable to delete pool',
        type: 'pool-delete-error',
      };

      return res.redirect('/pool-management/pool-overview/' + req.session.poolDetails.poolDetails.poolNumber);
    };

    deletePoolObject.delete(
      require('request-promise'),
      app,
      req.session.authToken,
      req.session.poolDetails.poolDetails.poolNumber,
    )
      .then(successCB)
      .catch(errorCB);
  };
};
