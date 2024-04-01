(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const { isSystemAdministrator, isCourtUser } = require('../../../components/auth/user-type');
  const controller = require('./court-details.controller');
  const errors = require('../../../components/errors');
  const hasCourtDetailsAccess = function(req, res, next) {
    if (
      isSystemAdministrator(req, res) || isCourtUser(req, res)
    ) {
      if (typeof next !== 'undefined') {
        return next();
      }
      return true;
    }
    if (typeof next !== 'undefined') {
      return errors(req, res, 403);
    }
    return false;
  };

  module.exports = function(app) {
    app.get('/administration/court-details/:locationCode',
      'administration.court-details.get',
      auth.verify,
      hasCourtDetailsAccess,
      controller.getCourtDetails(app),
    );

    app.post('/administration/court-details/:locationCode',
      'administration.court-details.post',
      auth.verify,
      hasCourtDetailsAccess,
      controller.postCourtDetails(app),
    );
  };
})();
