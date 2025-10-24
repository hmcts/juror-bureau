/**
 * Main application routes
 */

;(function(){
  'use strict';

  var errors = require('./../components/errors')
    , Router = require('named-routes')
    , router = new Router();
  const auth = require('../components/auth');

  module.exports = function(app) {
    // Set up named routes
    router.extendExpress(app);
    router.registerAppHelpers(app);

    require('./authentication')(app);

    // Insert routes below
    require('./actuator')(app);
    require('./allocation')(app);
    require('./completed')(app);
    require('./inbox')(app);
    require('./login')(app);
    require('./pending')(app);
    require('./response/detail')(app);
    require('./search')(app);
    require('./staff')(app);
    require('./dashboard')(app);
    require('./dashboard/deferral-excusal')(app);

    // because of the order that routes are registered we need to have a check before any new routes are visited
    // when a user tries to access any of the new features, this "middleware" will run and check if they have access
    // if NO they will be redirected to 404... if YES express will just run next()
    app.route('/*splat')
      .get(launchDarklyHandler(app))
      .post(launchDarklyHandler(app));

    require('./homepage')(app);
    require('./pool-management')(app);
    require('./juror-management')(app);
    require('./summons-management')(app);
    require('./trial-management')(app);
    require('./reporting')(app);
    require('./sjo-tasks')(app);
    require('./documents')(app);
    require('./messaging')(app);
    require('./administration')(app);
    require('./quick-links')(app);
    require('./date-picker')(app);

    app.route('/multiple-tabs')
      .get(auth.verify, (req, res) => {
        const { action } = req.query;

        req.session.multipleTabs = action === 'opened';

        if (action === 'opened') {
          app.logger.info('User has opened multiple tabs', {
            auth: req.session.authentication,
          });
        }

        return res.send();
      });

    app.route('/health')
      .get(function(req, res) {
        return errors(req, res, 200);
      });

    app.route('/health/*splat')
      .get(function(req, res) {
        return errors(req, res, 200);
      });

    // All undefined asset or api routes should return a 404
    app.route(['/api/*splat', '/auth/*splat', '/components/*splat', '/app/*splat', '/bower_components/*splat', '/assets/*splat'])
      .get(function(req, res) {
        return errors(req, res, 404);
      });

  

    // Reaching this point implys to URL matches have been made, we can render standard 404.
    app.route('/*splat')
      .get(function(req, res) {
        return errors(req, res, 404);
      });
  };

  // handler function to reject any access to new features if the user is not on ld authed list
  function launchDarklyHandler(app) {
    return function(req, res, next) {
      if (req.url.startsWith('/css') || req.url.startsWith('/js')) {
        return next();
      }

      if (typeof req.session.authentication !== 'undefined' && !req.session.hasModAccess) {
        app.logger.warn('User with no access tried accessing modern features: ', {
          auth: req.session.authentication,
          path: req.url,
        });

        return errors(req, res, 404);
      }

      next();
    };
  }
})();
