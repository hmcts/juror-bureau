;(function(){

  /**
   * Authentication Module
   * @version 0.0.1
   * @author ODSC
   * @exports authenticate|verify|getToken|createJWTToken
   * @namespace server/components/auth
   */

  'use strict';

  var jwt = require('jsonwebtoken')

    , secretsConfig = require('config')
    , errors = require('../errors')
    , authObj = require('../../objects/auth').object
    , msgMappings = require('../errors/message-mapping')
    , { isBureauUser, isCourtUser, isSJOUser, isBureauManager, isCourtManager, isSystemAdministrator } = require('./user-type')

    , createJWTToken = function(req, body, key) {
      // if user is found create a token
      var token = jwt.sign(body, key, { expiresIn: secretsConfig.get('secrets.juror.bureau-jwtTTL') });

      // Store in session
      req.session.authToken = token;
      req.session.authKey = key;

      return token;
    }

    , getToken = function(req) {
      var decoded = jwt.decode(req.session.authToken);

      if (decoded !== null && decoded.hasOwnProperty('data')) {
        return decoded.data;
      }
      return decoded;
    }

    , authenticate = function(req, app, successCB, errorCB) {
      // Data that will be send as payload
      var userObj = {
          userId: req.body.userID,
          password: req.body.password,
        }
        , authSuccess = function(resp) {
          createJWTToken(req, resp, secretsConfig.get('secrets.juror.bureau-jwtKey'));
          return successCB(resp);
        }
        , authFailure = function(err) {
          var errJson = { statusCode: err.statusCode, error: 'USER_NOT_FOUND', originalError: err.error }
            , identifiedErr
            , logonMsgs = msgMappings.logon;

          // Map the provided error message to our identifiers
          Object.keys(logonMsgs).forEach(function(o) {
            if (o === err.error.message) {
              identifiedErr = err.error.message;
            }
          });

          // Set the returned error message to this identifier
          if (typeof identifiedErr !== 'undefined') {
            errJson.error = identifiedErr;
          }

          // Return the error as an identifier
          return errorCB(errJson);
        };

      // Send request using auth request object
      authObj.post(require('request-promise'), app, req.session.authToken, userObj)
        .then(authSuccess)
        .catch(authFailure);
    }

    , logout = function(req, res) {
      delete req.session.authToken;
      delete req.session.authKey;
      delete req.session.authentication;
      delete res.locals.authentication;
    }

    , verify = function(req, res, next) {
      // check header or url parameters or post parameters for token
      var token = req.session.authToken;

      // decode token
      if (token) {
        // verifies secret and checks expiry
        jwt.verify(token, req.session.authKey, function(err, decoded) {
          if (err) {
            return errors(req, res, 403, '/');
          }

          // if no errors, then decode and verify the token body
          req.decoded = decoded;

          // if we do not have a userLevel property then we should assume this
          // token is not for a logged in user.
          if (!decoded.hasOwnProperty('userLevel')) {
            return errors(req, res, 403, '/');
          }

          // If all is well then we check for a data tag in the response
          // and strip it out.
          if (decoded.hasOwnProperty('data')) {
            req.session.authentication = decoded.data;
          } else {
            req.session.authentication = decoded;
          }

          // Send login status to templates
          res.locals.authentication = req.session.authentication;
          res.locals.isSJO = isSJOUser(req, res);
          res.locals.isCourtUser = isCourtUser(req, res);
          res.locals.isBureauUser = isBureauUser(req, res);
          res.locals.isBureauManager = isBureauManager(req, res);
          res.locals.isCourtManager = isCourtManager(req, res);
          res.locals.isSystemAdministrator = isSystemAdministrator(req, res);

          return next();
        });

      } else {
        // Without a authentication token, we show an error page
        return errors(req, res, 403, '/');
      }
    }

    , isSupervisor = function(req, res, next) {
      if (
        Object.prototype.hasOwnProperty.call(req.session, 'authentication') === false ||
        Object.prototype.hasOwnProperty.call(req.session.authentication, 'staff') === false ||
        Object.prototype.hasOwnProperty.call(req.session.authentication.staff, 'rank') === false ||
        req.session.authentication.staff.rank === 0
      ) {
        // If not a supervisor, then redirect back to homepage with forbidden http code
        return errors(req, res, 403, '/inbox');
      }

      return next();
    }

    , isSJO = function(req, res, next) {
      if (!isSJOUser(req, res)) {
        return errors(req, res, 403, '/inbox');
      }

      return next();
    };

  // Export public functions
  module.exports.createJWTToken = createJWTToken;
  module.exports.authenticate = authenticate;
  module.exports.logout = logout;
  module.exports.verify = verify;
  module.exports.getToken = getToken;
  module.exports.isSupervisor = isSupervisor;
  module.exports.isSJO = isSJO;

})();
