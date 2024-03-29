const validate = require('validate.js');
const secretsConfig = require('config');
const authComponent = require('../../components/auth');
const msgMappings = require('../../components/errors/message-mapping');

module.exports.index = function () {
  return function (req, res) {
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

    // Render login page with any errors
    return res.render('sign-in.njk', {
      errors: {
        title: 'Please check the form',
        count: typeof req.session.errors !== 'undefined' ? Object.keys(req.session.errors).length : 0,
        items: req.session.errors,
      },
    });
  };
};

module.exports.create = function (app) {
  return function (req, res) {
    let validatorResult;
    let tmpSession;

    const successCB = function (response) {
      tmpSession = req.session;

      app.logger.info('Login attempt for userID "' + req.body.userID + '" succeeded: ', {
        userID: req.body.userID,
        jwt: req.session.authToken,
        response: response,
      });

      // Regenerate session
      req.session.regenerate(function (err) {
        if (err) {
          throw err;
        }

        // Regenerate the session
        req.session.authToken = tmpSession.authToken;
        req.session.authKey = tmpSession.authKey;

        req.session.user = tmpSession.user;
      });

      // We are changing the way launchdarkly works.... but need to keep the hasModAccess checks in
      // ... or else the app breaks :D
      req.session.hasModAccess = true;
      return redirectUser(app, response.owner, response.userType)(res);
    };
    const errorCB = function (err) {
      app.logger.warn('Login attempt for "' + req.body.userID + '" responded with ' + err.statusCode, {
        userID: req.body.userID,
        jwt: req.session.authToken,
        error: (typeof err.originalError.error !== 'undefined') ? err.originalError.error : err.originalError,
      });

      // Add error feedback
      if (typeof msgMappings.logon[err.error] === 'undefined') {
        err.error = 'unreachable';
      }

      req.session.errors = {
        userID: [{
          details: msgMappings.logon[err.error],
        }],
        //password: [{
        //  details: msgMappings.logon[err.error],
        //}],
      };

      return res.redirect(app.namedRoutes.build('login.get'));
    };


    // Reset error and saved field sessions
    delete req.session.errors;

    // Validate form submission
    validatorResult = validate(req.body, require('../../config/validation/login.js')(req));
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;

      return res.redirect(app.namedRoutes.build('login.get'));
    }

    // Send login to backend, callbacks will return as required
    authComponent.authenticate(req, app, successCB, errorCB);

  };
};

function redirectUser (app, owner, userType) {
  return function (res) {

    if (userType === 'ADMINISTRATOR') {
      return res.redirect(app.namedRoutes.build('administration.users.get'));
    }

    // if the user is not 400 they have no access to an inbox just yet... redirect to the homepage
    if (owner !== '400') {
      return res.redirect(app.namedRoutes.build('homepage.get'));
    }

    return res.redirect(app.namedRoutes.build('inbox.todo.get'));
  };
}
