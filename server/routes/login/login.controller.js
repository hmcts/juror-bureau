/**
 * Using Rails-like standard naming convention for endpoints.
 * GET    /    ->    index
 */

;(function(){
  'use strict';

  const _ = require('lodash');
  const secretsConfig = require('config');
  const authComponent = require('../../components/auth');

  module.exports.index = function() {
    return function(req, res) {
      // If already logged in, force logout
      if (typeof res.locals.authentication !== 'undefined') {
        authComponent.logout(req, res);
      }

      // On first load of app, when not authenticated, we want
      // to create a JWT that will be used for all API calls.
      //
      // It will have an empty body to begin with
      if (typeof req.session.authToken === 'undefined') {
        authComponent.createJWTToken(req, {}, secretsConfig.get('secrets.juror.bureau-jwtNoAuthKey'));
      }

      const tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      // Render login page with any errors
      return res.render('sign-in.njk', {
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

})();
